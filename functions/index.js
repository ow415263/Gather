const functions = require("firebase-functions");
const { onRequest, onCall } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const OpenAI = require("openai");

admin.initializeApp();

const recipeCategoryValues = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Drinks'];

exports.extractRecipe = onRequest({
    cors: true,
    region: "us-central1",
    secrets: ["OPENAI_API_KEY"],
    timeoutSeconds: 120, // Increased timeout for DALL-E
    memory: "512Mi"     // Increased memory
}, async (req, res) => {
    // 1. Basic security check
    console.log('[extractRecipe] Request received:', {
        method: req.method,
        origin: req.headers.origin,
        authHeaderPresent: !!req.headers.authorization,
        userIdInBody: req.body?.userId
    });

    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    // 2. Auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[extractRecipe] Missing or invalid Authorization header');
        res.status(401).send('Unauthorized: Missing or invalid Authorization header');
        return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log('[extractRecipe] Token verified for uid:', decodedToken.uid);
    } catch (error) {
        console.error('[extractRecipe] Token verification failed:', error.message);
        res.status(401).send('Unauthorized: Invalid token');
        return;
    }

    const { imageDataUrl, userId } = req.body;

    // Verify that the requested userId matches the token's uid
    if (userId !== decodedToken.uid) {
        console.error('[extractRecipe] User ID mismatch:', { bodyUserId: userId, tokenUid: decodedToken.uid });
        res.status(403).send('Forbidden: User ID mismatch');
        return;
    }

    if (!imageDataUrl) {
        res.status(400).send('Missing imageDataUrl');
        return;
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        res.status(500).send('OpenAI API Key not configured in Cloud Functions');
        return;
    }

    try {
        console.log('[extractRecipe] Initializing OpenAI client');
        const client = new OpenAI({ apiKey: OPENAI_API_KEY });

        const extractionInstructions = `Extract a complete recipe from the image. Populate every field in the recipe_extraction schema even when you have to make a reasonable culinary guess. Use the categories: Breakfast, Lunch, Dinner, Dessert, Snacks, Drinks. Maintain the original ordering for ingredients and instructions.`;

        console.log('[extractRecipe] Calling GPT-4o-mini for extraction');
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: extractionInstructions },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageDataUrl,
                                detail: 'high'
                            }
                        }
                    ]
                }
            ],
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: 'recipe_extraction',
                    strict: true,
                    schema: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            description: { type: 'string' },
                            category: { type: 'string', enum: recipeCategoryValues },
                            prepTime: { type: 'integer' },
                            cookTime: { type: 'integer' },
                            servings: { type: 'integer' },
                            ingredients: { type: 'array', items: { type: 'string' } },
                            instructions: { type: 'array', items: { type: 'string' } }
                        },
                        required: ['name', 'description', 'category', 'prepTime', 'cookTime', 'servings', 'ingredients', 'instructions'],
                        additionalProperties: false
                    }
                }
            }
        });

        const parsedContent = response.choices[0].message.content;
        if (!parsedContent) {
            throw new Error('No content returned from OpenAI');
        }

        const parsedRecipe = JSON.parse(parsedContent);
        console.log('[extractRecipe] Extraction successful for:', parsedRecipe.name);

        // --- NEW: Generate AI Image ---
        console.log('[extractRecipe] Generating AI image with DALL-E 3');
        let finalImageUrl = null;
        try {
            const imageResponse = await client.images.generate({
                model: "dall-e-3",
                prompt: `A professional food photography shot of ${parsedRecipe.name}. ${parsedRecipe.description}. The dish is beautifully plated and appetizing, with soft natural lighting. High resolution, high detail.`,
                n: 1,
                size: "1024x1024",
            });

            const dallEUrl = imageResponse.data[0].url;
            finalImageUrl = dallEUrl; // Set this as fallback immediately
            console.log('[extractRecipe] DALL-E URL generated, downloading...');

            try {
                // Download and upload to Firebase Storage
                const fetchRes = await fetch(dallEUrl);
                const arrayBuffer = await fetchRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                console.log('[extractRecipe] Image downloaded, saving to Storage...');
                const bucket = admin.storage().bucket();
                console.log('[extractRecipe] Using default bucket:', bucket.name);
                const fileName = `recipe-images/${userId}/${Date.now()}-${parsedRecipe.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
                const file = bucket.file(fileName);

                await file.save(buffer, {
                    metadata: { contentType: 'image/jpeg' }
                });

                // Make it public or get signed URL
                console.log('[extractRecipe] Attempting to make file public...');
                try {
                    await file.makePublic();
                    finalImageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                } catch (pError) {
                    console.warn('[extractRecipe] Could not make public, using signed URL');
                    const [signedUrl] = await file.getSignedUrl({
                        action: 'read',
                        expires: '03-01-2500' // Far future
                    });
                    finalImageUrl = signedUrl;
                }
                console.log('[extractRecipe] AI Image saved to Storage successfully:', finalImageUrl);
            } catch (storageError) {
                console.error('[extractRecipe] Storage upload failed, staying with DALL-E URL:', storageError.message);
                // We keep finalImageUrl as the DALL-E URL so the preview still works
            }
        } catch (imgError) {
            console.error('[extractRecipe] Image generation/upload stage failed:', imgError);
            // Fallback - we still return the recipe
        }

        // Normalize for client
        const normalized = {
            name: parsedRecipe.name.trim() || 'Untitled Recipe',
            description: (parsedRecipe.description || '').trim(),
            category: parsedRecipe.category,
            prepTime: parsedRecipe.prepTime || 0,
            cookTime: parsedRecipe.cookTime || 0,
            servings: parsedRecipe.servings || 1,
            ingredients: (parsedRecipe.ingredients || []).map(i => i.trim()).filter(Boolean),
            instructions: (parsedRecipe.instructions || []).map(i => i.trim()).filter(Boolean),
            imageUrl: finalImageUrl
        };

        res.status(200).json(normalized);
    } catch (error) {
        console.error('[extractRecipe] Global error:', error);
        res.status(500).send(error.message || 'Internal Server Error');
    }
});

exports.extractRecipeFromUrl = onRequest({
    cors: true,
    region: "us-central1",
    secrets: ["OPENAI_API_KEY"],
    timeoutSeconds: 120,
    memory: "512Mi"
}, async (req, res) => {
    console.log('[extractRecipeFromUrl] Request received:', {
        method: req.method,
        origin: req.headers.origin,
        authHeaderPresent: !!req.headers.authorization
    });

    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    // Auth check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[extractRecipeFromUrl] Missing or invalid Authorization header');
        res.status(401).send('Unauthorized: Missing or invalid Authorization header');
        return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log('[extractRecipeFromUrl] Token verified for uid:', decodedToken.uid);
    } catch (error) {
        console.error('[extractRecipeFromUrl] Token verification failed:', error.message);
        res.status(401).send('Unauthorized: Invalid token');
        return;
    }

    const { url, userId } = req.body;

    // Verify userId matches token
    if (userId !== decodedToken.uid) {
        console.error('[extractRecipeFromUrl] User ID mismatch');
        res.status(403).send('Forbidden: User ID mismatch');
        return;
    }

    if (!url) {
        res.status(400).send('Missing url');
        return;
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        res.status(500).send('OpenAI API Key not configured');
        return;
    }

    try {
        // Fetch the webpage HTML
        console.log('[extractRecipeFromUrl] Fetching URL:', url);
        const fetchResponse = await fetch(url);
        if (!fetchResponse.ok) {
            throw new Error(`Failed to fetch URL: ${fetchResponse.statusText}`);
        }
        const html = await fetchResponse.text();
        console.log('[extractRecipeFromUrl] HTML fetched, length:', html.length);

        // Extract recipe using OpenAI
        const client = new OpenAI({ apiKey: OPENAI_API_KEY });

        const extractionInstructions = `Extract the recipe from this HTML. Focus on finding recipe content (name, description, ingredients, instructions, prep/cook times, servings). Ignore ads, navigation, comments. Use categories: Breakfast, Lunch, Dinner, Dessert, Snacks, Drinks. Return complete recipe data.`;

        console.log('[extractRecipeFromUrl] Calling GPT-4o-mini for extraction');
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'user',
                    content: `${extractionInstructions}\n\nHTML:\n${html.substring(0, 50000)}` // Limit HTML to avoid token limits
                }
            ],
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: 'recipe_extraction',
                    strict: true,
                    schema: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            description: { type: 'string' },
                            category: { type: 'string', enum: recipeCategoryValues },
                            prepTime: { type: 'integer' },
                            cookTime: { type: 'integer' },
                            servings: { type: 'integer' },
                            ingredients: { type: 'array', items: { type: 'string' } },
                            instructions: { type: 'array', items: { type: 'string' } }
                        },
                        required: ['name', 'description', 'category', 'prepTime', 'cookTime', 'servings', 'ingredients', 'instructions'],
                        additionalProperties: false
                    }
                }
            }
        });

        const parsedContent = response.choices[0].message.content;
        if (!parsedContent) {
            throw new Error('No content returned from OpenAI');
        }

        const parsedRecipe = JSON.parse(parsedContent);
        console.log('[extractRecipeFromUrl] Extraction successful for:', parsedRecipe.name);

        // Generate AI Image (optional)
        console.log('[extractRecipeFromUrl] Generating AI image with DALL-E 3');
        let finalImageUrl = null;
        try {
            const imageResponse = await client.images.generate({
                model: "dall-e-3",
                prompt: `A professional food photography shot of ${parsedRecipe.name}. ${parsedRecipe.description}. The dish is beautifully plated and appetizing, with soft natural lighting. High resolution, high detail.`,
                n: 1,
                size: "1024x1024",
            });

            const dallEUrl = imageResponse.data[0].url;
            finalImageUrl = dallEUrl;
            console.log('[extractRecipeFromUrl] DALL-E URL generated, downloading...');

            try {
                // Download and upload to Firebase Storage
                const fetchRes = await fetch(dallEUrl);
                const arrayBuffer = await fetchRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                console.log('[extractRecipeFromUrl] Image downloaded, saving to Storage...');
                const bucket = admin.storage().bucket();
                const fileName = `recipe-images/${userId}/${Date.now()}-${parsedRecipe.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
                const file = bucket.file(fileName);

                await file.save(buffer, {
                    metadata: { contentType: 'image/jpeg' }
                });

                // Make it public or get signed URL
                console.log('[extractRecipeFromUrl] Attempting to make file public...');
                try {
                    await file.makePublic();
                    finalImageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                } catch (pError) {
                    console.warn('[extractRecipeFromUrl] Could not make public, using signed URL');
                    const [signedUrl] = await file.getSignedUrl({
                        action: 'read',
                        expires: '03-01-2500'
                    });
                    finalImageUrl = signedUrl;
                }
                console.log('[extractRecipeFromUrl] AI Image saved to Storage successfully:', finalImageUrl);
            } catch (storageError) {
                console.error('[extractRecipeFromUrl] Storage upload failed:', storageError.message);
            }
        } catch (imgError) {
            console.error('[extractRecipeFromUrl] Image generation failed:', imgError);
        }

        // Normalize for client
        const normalized = {
            name: parsedRecipe.name.trim() || 'Untitled Recipe',
            description: (parsedRecipe.description || '').trim(),
            category: parsedRecipe.category,
            prepTime: parsedRecipe.prepTime || 0,
            cookTime: parsedRecipe.cookTime || 0,
            servings: parsedRecipe.servings || 1,
            ingredients: (parsedRecipe.ingredients || []).map(i => i.trim()).filter(Boolean),
            instructions: (parsedRecipe.instructions || []).map(i => i.trim()).filter(Boolean),
            imageUrl: finalImageUrl
        };

        res.status(200).json(normalized);
    } catch (error) {
        console.error('[extractRecipeFromUrl] Global error:', error);
        res.status(500).send(error.message || 'Internal Server Error');
    }
});

exports.generateRecipe = onCall({
    region: "us-central1",
    secrets: ["OPENAI_API_KEY"],
    timeoutSeconds: 60,
    memory: "1GiB"
}, async (request) => {
    // onCall automatically handles auth. request.auth contains user info.
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { prompt, userContext } = request.data;
    if (!prompt) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "prompt" argument.');
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        throw new functions.https.HttpsError('internal', 'OpenAI API Key not configured');
    }

    try {
        const client = new OpenAI({ apiKey: OPENAI_API_KEY });

        const systemPrompt = `
      You are a professional chef. Generate a structured recipe based on the user's request.
      
      User Context (Dietary Preferences): ${userContext?.foodPreferences?.join(', ') || 'None'}
      User Name (Family Cook): ${userContext?.familyCookName || 'Home Cook'}

      Output JSON format:
      {
        "name": "Recipe Name",
        "description": "Short appetizing description",
        "category": "One of: Breakfast, Lunch, Dinner, Dessert, Snacks, Drinks",
        "prepTime": number (minutes),
        "cookTime": number (minutes),
        "servings": number,
        "ingredients": ["1 cup flour", "2 eggs"],
        "instructions": ["Mix 1 cup flour and 2 eggs...", "Step 2..."]
      }
      
      Ensure the recipe strictly follows the User Context constraints if provided.
      IMPORTANT: In the instructions, ALWAYS include the specific quantity of the ingredient being used (e.g. "Add 2 cups flour" instead of just "Add flour").
      Respond ONLY with the JSON object.
    `;

        console.log('[generateRecipe] Calling GPT-4o-mini for recipe generation');
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
        });

        const result = completion.choices[0].message.content;
        if (!result) throw new functions.https.HttpsError('internal', 'No content generated from OpenAI');

        const parsedRecipe = JSON.parse(result);
        console.log('[generateRecipe] Recipe generated:', parsedRecipe.name);

        return parsedRecipe;

    } catch (error) {
        console.error('[generateRecipe] Error:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to generate recipe');
    }
});

exports.generateRecipeImage = onCall({
    region: "us-central1",
    secrets: ["OPENAI_API_KEY"],
    timeoutSeconds: 120,
    memory: "512Mi"
}, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { recipeId, recipeName, recipeDescription } = request.data;
    if (!recipeId || !recipeName) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing formulation arguments');
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        throw new functions.https.HttpsError('internal', 'OpenAI API Key not configured');
    }

    try {
        const client = new OpenAI({ apiKey: OPENAI_API_KEY });
        const userId = request.auth.uid;

        console.log('[generateRecipeImage] Generating AI image with DALL-E 3 for:', recipeName);
        let finalImageUrl = null;

        const imageResponse = await client.images.generate({
            model: "dall-e-3",
            prompt: `A professional food photography shot of ${recipeName}. ${recipeDescription || ''}. The dish is beautifully plated and appetizing, with soft natural lighting. High resolution, high detail.`,
            n: 1,
            size: "1024x1024",
        });

        const dallEUrl = imageResponse.data[0].url;
        finalImageUrl = dallEUrl; // Set this as fallback immediately
        console.log('[generateRecipeImage] DALL-E URL generated, downloading...');

        try {
            // Download and upload to Firebase Storage
            const fetchRes = await fetch(dallEUrl);
            const arrayBuffer = await fetchRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            console.log('[generateRecipeImage] Image downloaded, saving to Storage...');
            const bucket = admin.storage().bucket();
            const fileName = `recipe-images/${userId}/${Date.now()}-${recipeName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
            const file = bucket.file(fileName);

            await file.save(buffer, {
                metadata: { contentType: 'image/jpeg' }
            });

            // Make it public or get signed URL
            console.log('[generateRecipeImage] Attempting to make file public...');
            try {
                await file.makePublic();
                finalImageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            } catch (pError) {
                console.warn('[generateRecipeImage] Could not make public, using signed URL');
                const [signedUrl] = await file.getSignedUrl({
                    action: 'read',
                    expires: '03-01-2500' // Far future
                });
                finalImageUrl = signedUrl;
            }
            console.log('[generateRecipeImage] AI Image saved to Storage successfully:', finalImageUrl);

            // Update the recipe in Firestore
            await admin.firestore().collection('users').doc(userId).collection('recipes').doc(recipeId).update({
                imageUrl: finalImageUrl
            });

        } catch (storageError) {
            console.error('[generateRecipeImage] Storage upload failed:', storageError.message);
            // Even if storage fails, we might want to update with the DALL-E URL (temporary) or just log it
        }

        return { imageUrl: finalImageUrl };

    } catch (error) {
        console.error('[generateRecipeImage] Error:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to generate recipe image');
    }
});

exports.suggestRefinements = onCall({
    region: "us-central1",
    secrets: ["OPENAI_API_KEY"],
    timeoutSeconds: 30,
    memory: "512Mi"
}, async (request) => {
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { prompt, userContext } = request.data;
    if (!prompt) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with a "prompt" argument.');
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        throw new functions.https.HttpsError('internal', 'OpenAI API Key not configured');
    }

    try {
        const client = new OpenAI({ apiKey: OPENAI_API_KEY });

        const systemPrompt = `
      You are a chef consultant. user wants a recipe based on a prompt.
      Analyze the text and their context. Suggest follow-up refinements to help them decide the final dish.
      
      User Context: ${userContext?.foodPreferences?.join(', ') || 'None'}
      User Prompt: "${prompt}"

      Output JSON format:
      {
        "cuisines": ["Option 1 (e.g. Thai Curry)", "Option 2 (e.g. Mediterranean)", "Option 3 (e.g. Classic Roast)"],
        "tags": ["Tag 1 (e.g. Spicy)", "Tag 2 (e.g. Quick)", "Tag 3 (e.g. Healthy)", "Tag 4 (e.g. Comfort)"]
      }

      - "cuisines": Provide 3 distinct culinary directions or specific dish types that fit the prompt.
      - "tags": Provide 4 relevant boolean constraints/adjectives they might want to toggle.
      - Keep options short (1-3 words).
    `;

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Suggest refinements." }
            ],
            response_format: { type: "json_object" },
        });

        const result = completion.choices[0].message.content;
        if (!result) throw new functions.https.HttpsError('internal', 'No content generated from OpenAI');

        return JSON.parse(result);

    } catch (error) {
        console.error('[suggestRefinements] Error:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to suggest refinements');
    }
});

exports.generateRecipeStream = onRequest({
    cors: true,
    region: "us-central1",
    secrets: ["OPENAI_API_KEY"],
    timeoutSeconds: 60,
    memory: "1GiB"
}, async (req, res) => {
    // 1. Validate Method
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    // 2. Validate Auth
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        return;
    }
    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).send('Unauthorized');
        return;
    }

    const { prompt, userContext } = req.body;
    if (!prompt) {
        res.status(400).send('Missing prompt');
        return;
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        res.status(500).send('OpenAI API Key not configured');
        return;
    }

    try {
        const client = new OpenAI({ apiKey: OPENAI_API_KEY });
        const systemPrompt = `
      You are a professional chef. Generate a structured recipe.
      User Context: ${userContext?.foodPreferences?.join(', ') || 'None'}
      User Name: ${userContext?.familyCookName || 'Home Cook'}

      Output JSON format:
      {
        "name": "Recipe Name",
        "description": "Short appetizing description",
        "category": "One of: Breakfast, Lunch, Dinner, Dessert, Snacks, Drinks",
        "prepTime": number (minutes),
        "cookTime": number (minutes),
        "servings": number,
        "ingredients": ["1 cup flour", "2 eggs"],
        "instructions": ["Mix 1 cup flour...", "Step 2..."]
      }
      ALWAYS include quantities in instructions.
      Respond ONLY with the JSON object.
    `;

        const stream = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            stream: true,
            response_format: { type: "json_object" },
        });

        res.setHeader('Content-Type', 'text/plain');

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                res.write(content);
            }
        }
        res.end();

    } catch (error) {
        console.error('Stream Error:', error);
        res.status(500).send(error.message);
    }
});

// --- GAMIFICATION TRIGGERS ---
exports.onPostCreated = onDocumentCreated("posts/{postId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const post = snapshot.data();
    const userId = post.userId;
    if (!userId) return;

    const userRef = admin.firestore().collection('users').doc(userId);

    // +10 Points for posting
    // +1 Post Count
    await userRef.set({
        stats: {
            postsCount: admin.firestore.FieldValue.increment(1),
            foodieScore: admin.firestore.FieldValue.increment(10)
        }
    }, { merge: true });
});

exports.onRecipeCreated = onDocumentCreated("users/{userId}/recipes/{recipeId}", async (event) => {
    const userId = event.params.userId;
    const userRef = admin.firestore().collection('users').doc(userId);

    // +5 Points for adding a recipe
    // +1 Recipe Count
    await userRef.set({
        stats: {
            recipesCount: admin.firestore.FieldValue.increment(1),
            foodieScore: admin.firestore.FieldValue.increment(5)
        }
    }, { merge: true });
});
