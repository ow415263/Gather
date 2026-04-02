import { useState } from 'react'
import { toast } from 'sonner'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { getAuth } from 'firebase/auth'
import { UserProfile } from './use-user-profile'
import { useRecipes } from './use-recipes'
import { ExtractedRecipeData, RecipeCategory } from '@/lib/types'
import { getCategoryImage } from '@/lib/categoryImages'

export interface RefinementData {
    cuisines: string[]
    tags: string[]
}

// Helper to parse incomplete JSON strings
function parsePartialJson(jsonString: string) {
    try {
        // 1. Try parsing as is
        return JSON.parse(jsonString);
    } catch (e) {
        // 2. Try fixing common truncation issues
        let fixed = jsonString.trim();

        // Remove trailing commas before closing braces (common in partial streams)
        fixed = fixed.replace(/,(\s*[}\]])/g, '$1');

        // Close arrays and objects if they are open
        const openBraces = (fixed.match(/{/g) || []).length;
        const closeBraces = (fixed.match(/}/g) || []).length;
        const openSquare = (fixed.match(/\[/g) || []).length;
        const closeSquare = (fixed.match(/\]/g) || []).length;
        const quoteCount = (fixed.match(/"/g) || []).length;

        // If inside a string, close it
        if (quoteCount % 2 !== 0) {
            fixed += '"';
        }

        // Close arrays
        for (let i = 0; i < openSquare - closeSquare; i++) {
            fixed += ']';
        }

        // Close objects
        for (let i = 0; i < openBraces - closeBraces; i++) {
            fixed += '}';
        }

        try {
            return JSON.parse(fixed);
        } catch (e2) {
            return null; // Still invalid
        }
    }
}

export function useGenerateRecipe() {
    const [isGenerating, setIsGenerating] = useState(false)
    const [isRefining, setIsRefining] = useState(false)
    const { addRecipe } = useRecipes()

    const refine = async (prompt: string, profile: UserProfile | null): Promise<RefinementData | null> => {
        setIsRefining(true)
        try {
            const suggestRefinements = httpsCallable<{ prompt: string; userContext: UserProfile | null }, RefinementData>(
                functions,
                'suggestRefinements'
            )

            const result = await suggestRefinements({
                prompt,
                userContext: profile
            })

            return result.data
        } catch (error) {
            console.error('Refinement error:', error)
            toast.error('Failed to get suggestions. Skipping refinement.')
            return null
        } finally {
            setIsRefining(false)
        }
    }

    const generate = async (
        prompt: string,
        profile: UserProfile | null,
        selectedCuisine?: string,
        selectedTags: string[] = [],
        numCourses: number = 1,
        numServings: number = 2,
        onProgress?: (data: Partial<ExtractedRecipeData>) => void,
        overrideImage?: string
    ) => {
        console.log('[useGenerateRecipe] Starting generation', { prompt, numCourses, numServings, selectedCuisine, selectedTags });
        if (numCourses === undefined || numServings === undefined) {
            console.error('[useGenerateRecipe] Undefined courses or servings', { numCourses, numServings });
        }

        setIsGenerating(true)

        // Construct final prompt with refinements
        let finalPrompt = prompt

        // Add course context if > 1
        if (numCourses > 1) {
            finalPrompt += ` Create a ${numCourses}-course meal.`
            finalPrompt += ` SCALE INGREDIENTS FOR ${numServings} PEOPLE.`
            finalPrompt += ` Please structure the response as a single JSON object with a "courses" array. Each item in "courses" should have "name", "ingredients", and "instructions".`
            finalPrompt += ` IMPORTANT: The top-level JSON MUST include "name", "description", "prepTime", "cookTime", "servings", and "tags" (array of strings, e.g. ["Italian", "Spicy"]) for the entire meal.`
            // Fallback instruction for compatibility
            finalPrompt += ` Also include "ingredients" and "instructions" at the top level as a summary or aggregation.`
        } else {
            finalPrompt += ` SCALE INGREDIENTS FOR ${numServings} PEOPLE.`
        }

        if (selectedCuisine) {
            finalPrompt += ` Style: ${selectedCuisine}.`
        }
        if (selectedTags.length > 0) {
            finalPrompt += ` Constraints: ${selectedTags.join(', ')}.`
        }

        try {
            const auth = getAuth()
            const token = await auth.currentUser?.getIdToken()

            // Determine URL based on environment
            const PROJECT_ID = 'recipebook-5a2d6';
            const REGION = 'us-central1';
            const HASH = 'id5qhs6knq';

            // 1. If running in PROD (built app), always use the deployed Cloud Function.
            // 2. If running locally (dev server), use local emulator.
            const isProd = import.meta.env.PROD;

            const functionUrl = isProd
                ? `https://generaterecipestream-${HASH}-uc.a.run.app`
                : `http://127.0.0.1:5001/${PROJECT_ID}/${REGION}/generateRecipeStream`;

            console.log('[Generate] Using Stream URL:', functionUrl);

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    prompt: finalPrompt,
                    userContext: profile
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = '';
            let finalData: ExtractedRecipeData | null = null;

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    accumulatedText += chunk;

                    const partialData = parsePartialJson(accumulatedText);
                    if (partialData) {
                        onProgress?.(partialData);
                        // Store valid parses as we go, the last one will be the most complete
                        finalData = partialData as ExtractedRecipeData;
                    }
                }
            }

            // Inside generate function, before addRecipe
            // Final parse attempt to ensure we have everything
            if (!finalData) {
                try {
                    finalData = JSON.parse(accumulatedText) as ExtractedRecipeData;
                } catch (e) {
                    console.error('Final JSON parse failed', e);
                    throw new Error('Failed to parse generated recipe');
                }
            }

            // Inject static image if none exists (Optimization)
            if (overrideImage) {
                finalData.imageUrl = overrideImage
            } else if (!finalData.imageUrl) {
                finalData.imageUrl = getCategoryImage(finalData.category as RecipeCategory)
            }

            // Save to Firestore
            const id = await addRecipe(finalData!)

            const fullRecipe = { ...finalData!, id, createdAt: Date.now() }

            // Trigger Image Generation in Background (Fire & Forget)
            // DISABLED: User prefers static images for now (faster/cheaper)
            /*
            const generateRecipeImage = httpsCallable<{ recipeId: string; recipeName: string; recipeDescription: string }, { imageUrl: string }>(
                functions,
                'generateRecipeImage'
            )

            generateRecipeImage({
                recipeId: id,
                recipeName: finalData!.name,
                recipeDescription: finalData!.description || ''
            }).catch(err => {
                console.error('Background image generation failed:', err)
            })
            */

            toast.success(`✨ Recipe "${finalData!.name}" generated!`)
            return fullRecipe
        } catch (error) {
            console.error('Generation error:', error)
            toast.error('Failed to generate recipe. Please try again.')
            throw error
        } finally {
            setIsGenerating(false)
        }
    }

    return {
        generate,
        refine,
        isGenerating,
        isRefining
    }
}
