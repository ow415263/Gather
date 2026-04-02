import { ExtractedRecipeData, RecipeCategory } from '../lib/types'
import OpenAI from 'openai'
import { z } from 'zod'
import { zodTextFormat } from 'openai/helpers/zod'

const recipeCategoryValues = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Drinks'] as const

const recipeExtractionSchema = z.object({
  name: z.string().min(1).catch('Untitled Recipe'),
  description: z.string().catch(''),
  category: z.enum(recipeCategoryValues).catch('Dinner'),
  prepTime: z.coerce.number().int().min(0).catch(0),
  cookTime: z.coerce.number().int().min(0).catch(0),
  servings: z.coerce.number().int().min(1).catch(4),
  ingredients: z.array(z.string().min(1)).min(1).catch([]),
  instructions: z.array(z.string().min(1)).min(1).catch([])
})

const recipeExtractionFormat = zodTextFormat(recipeExtractionSchema, 'recipe_extraction')
type RecipeExtractionResult = z.infer<typeof recipeExtractionSchema>

// Shared extraction logic for serverless functions
export async function extractRecipeFromImageServer(imageDataUrl: string): Promise<ExtractedRecipeData> {
  // Safe access to environment variable that works in both Node (server) and Vite (client - if replaced)
  const OPENAI_API_KEY = typeof process !== 'undefined' && process.env ? process.env.OPENAI_API_KEY : import.meta.env?.VITE_OPENAI_API_KEY


  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured on server. Please add OPENAI_API_KEY to your environment.')
  }

  try {
    const client = new OpenAI({ apiKey: OPENAI_API_KEY })

    const extractionInstructions = `Extract a complete recipe from the image. Populate every field in the recipe_extraction schema even when you have to make a reasonable culinary guess. Use the categories: Breakfast, Lunch, Dinner, Dessert, Snacks, Drinks. Maintain the original ordering for ingredients and instructions.`

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
                url: imageDataUrl.startsWith('data:') ? imageDataUrl : imageDataUrl,
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
    })

    const parsedContent = response.choices[0].message.content
    if (!parsedContent) {
      throw new Error('No content returned from OpenAI')
    }

    const parsedRecipe = JSON.parse(parsedContent) as RecipeExtractionResult

    if (!parsedRecipe) {
      throw new Error('Failed to parse recipe data from OpenAI response')
    }

    console.log('[Server] Extraction successful for:', parsedRecipe.name)

    // --- NEW: Generate AI Image locally ---
    let finalImageUrl: string | undefined = undefined
    try {
      console.log('[Server] Generating AI dish image with DALL-E 3...')
      const imageResponse = await client.images.generate({
        model: "dall-e-3",
        prompt: `A professional food photography shot of ${parsedRecipe.name}. ${parsedRecipe.description}. The dish is beautifully plated and appetizing, with soft natural lighting. High resolution, high detail.`,
        n: 1,
        size: "1024x1024",
      })

      finalImageUrl = imageResponse?.data?.[0]?.url
      console.log('[Server] AI Image generated (DALL-E URL):', finalImageUrl)
    } catch (imgError) {
      console.error('[Server] Image generation failed:', imgError)
    }

    const normalizedCategory = recipeCategoryValues.includes(parsedRecipe.category as typeof recipeCategoryValues[number])
      ? parsedRecipe.category
      : 'Dinner'

    const sanitizeList = (items: string[]) => items.map(item => item.trim()).filter(Boolean)

    return {
      name: parsedRecipe.name.trim() || 'Untitled Recipe',
      description: parsedRecipe.description.trim(),
      category: normalizedCategory as RecipeCategory,
      prepTime: parsedRecipe.prepTime,
      cookTime: parsedRecipe.cookTime,
      servings: parsedRecipe.servings,
      ingredients: sanitizeList(parsedRecipe.ingredients),
      instructions: sanitizeList(parsedRecipe.instructions),
      imageUrl: finalImageUrl
    }
  } catch (error: any) {
    console.error('[Server] Extraction error:', error)
    throw error
  }
}
