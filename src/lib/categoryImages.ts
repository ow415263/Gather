import { RecipeCategory } from './types'

export const CATEGORY_IMAGES: Record<RecipeCategory, string> = {
    'Breakfast': 'https://images.unsplash.com/photo-1533089862017-54148d31ea83?q=75&w=800&auto=format&fit=crop',
    'Lunch': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=75&w=800&auto=format&fit=crop',
    'Dinner': 'https://images.unsplash.com/photo-1529325973309-369ec8228291?q=75&w=800&auto=format&fit=crop',
    'Dessert': 'https://images.unsplash.com/photo-1563729768-74915bd6b27c?q=75&w=800&auto=format&fit=crop',
    'Snacks': 'https://images.unsplash.com/photo-1621939514649-28b12e81658e?q=75&w=800&auto=format&fit=crop',
    'Drinks': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?q=75&w=800&auto=format&fit=crop',
    'All': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=75&w=800&auto=format&fit=crop'
}

export function getCategoryImage(category: RecipeCategory): string {
    return CATEGORY_IMAGES[category] || CATEGORY_IMAGES['All']
}
