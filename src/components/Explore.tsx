import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RecipeCard } from '@/components/RecipeCard'
import { Recipe } from '@/lib/types'
import {
  MagnifyingGlass,
  Star,
  Heart,
  Sparkle,
  ForkKnife,
  Leaf,
  CookingPot,
  Funnel,
  BookBookmark
} from '@phosphor-icons/react'

interface ExploreProps {
  onViewRecipe: (recipe: Recipe) => void
  onRate?: (recipeId: string, rating: number) => void
  foodPreferences: string[]
  userRecipes?: Recipe[]
}

type CategoryType = 'all' | 'recommended' | 'most-liked' | 'healthy' | 'thai' | 'indian' | 'korean' | 'italian' | 'mexican' | 'chinese' | 'japanese' | 'french' | 'mediterranean' | 'bbq' | 'vegetarian' | 'vegan'

interface Category {
  id: CategoryType
  label: string
  icon: React.ReactNode
}

const allCategories: Category[] = [
  { id: 'all', label: 'All', icon: <ForkKnife size={20} weight="bold" /> },
  { id: 'recommended', label: 'Recommended', icon: <Sparkle size={20} weight="fill" /> },
  { id: 'most-liked', label: 'Most Liked', icon: <Heart size={20} weight="fill" /> },
  { id: 'healthy', label: 'Healthy', icon: <Leaf size={20} weight="bold" /> },
  { id: 'vegetarian', label: 'Vegetarian', icon: <Leaf size={20} weight="bold" /> },
  { id: 'vegan', label: 'Vegan', icon: <Leaf size={20} weight="bold" /> },
  { id: 'thai', label: 'Thai', icon: <CookingPot size={20} weight="bold" /> },
  { id: 'indian', label: 'Indian', icon: <CookingPot size={20} weight="bold" /> },
  { id: 'korean', label: 'Korean', icon: <CookingPot size={20} weight="bold" /> },
  { id: 'italian', label: 'Italian', icon: <CookingPot size={20} weight="bold" /> },
  { id: 'mexican', label: 'Mexican', icon: <CookingPot size={20} weight="bold" /> },
  { id: 'chinese', label: 'Chinese', icon: <CookingPot size={20} weight="bold" /> },
  { id: 'japanese', label: 'Japanese', icon: <CookingPot size={20} weight="bold" /> },
  { id: 'french', label: 'French', icon: <CookingPot size={20} weight="bold" /> },
  { id: 'mediterranean', label: 'Mediterranean', icon: <CookingPot size={20} weight="bold" /> },
  { id: 'bbq', label: 'BBQ', icon: <CookingPot size={20} weight="bold" /> },
]

// Mock curated recipes - In production, these would come from an API
// Could be from celebrity chefs, restaurants, food bloggers, etc.
const getMockCuratedRecipes = (): Recipe[] => {
  return [
    {
      id: 'curated-1',
      name: 'Chef Ramsey\'s Perfect Pad Thai',
      description: 'Authentic Thai street food favorite with a gourmet twist',
      category: 'Dinner',
      prepTime: 20,
      cookTime: 15,
      servings: 4,
      ingredients: ['Rice noodles', 'Shrimp', 'Tamarind paste', 'Fish sauce', 'Bean sprouts', 'Peanuts', 'Lime'],
      instructions: ['Soak noodles', 'Prepare sauce', 'Stir-fry ingredients', 'Toss with noodles'],
      createdAt: Date.now(),
      imageUrl: undefined,
      rating: 4.8,
      reviewCount: 124,
      userId: 'chef-ramsey'
    },
    {
      id: 'curated-2',
      name: 'Mediterranean Quinoa Bowl',
      description: 'Healthy and delicious bowl packed with nutrients',
      category: 'Lunch',
      prepTime: 15,
      cookTime: 20,
      servings: 2,
      ingredients: ['Quinoa', 'Chickpeas', 'Cucumber', 'Cherry tomatoes', 'Feta', 'Olive oil', 'Lemon'],
      instructions: ['Cook quinoa', 'Chop vegetables', 'Mix ingredients', 'Dress with olive oil and lemon'],
      createdAt: Date.now(),
      imageUrl: undefined,
      rating: 4.5,
      reviewCount: 89,
      userId: 'health-guru'
    },
    {
      id: 'curated-3',
      name: 'Authentic Butter Chicken',
      description: 'Rich and creamy Indian curry from Mumbai\'s finest',
      category: 'Dinner',
      prepTime: 30,
      cookTime: 40,
      servings: 6,
      ingredients: ['Chicken thighs', 'Butter', 'Cream', 'Tomato puree', 'Garam masala', 'Ginger', 'Garlic'],
      instructions: ['Marinate chicken', 'Make sauce', 'Cook chicken', 'Simmer together'],
      createdAt: Date.now(),
      imageUrl: undefined,
      rating: 4.9,
      reviewCount: 2056,
      userId: 'curry-master'
    },
    {
      id: 'curated-4',
      name: 'Korean BBQ Bulgogi',
      description: 'Sweet and savory marinated beef, Seoul-style',
      category: 'Dinner',
      prepTime: 15,
      cookTime: 10,
      servings: 4,
      ingredients: ['Beef ribeye', 'Soy sauce', 'Sugar', 'Sesame oil', 'Pear', 'Garlic', 'Green onions'],
      instructions: ['Slice beef thin', 'Make marinade', 'Marinate 2 hours', 'Grill quickly'],
      createdAt: Date.now(),
      imageUrl: undefined,
      rating: 4.7,
      reviewCount: 342,
      userId: 'seoul-kitchen'
    },
    {
      id: 'curated-5',
      name: 'Classic Italian Carbonara',
      description: 'Rome\'s signature pasta dish with authentic technique',
      category: 'Dinner',
      prepTime: 10,
      cookTime: 15,
      servings: 4,
      ingredients: ['Spaghetti', 'Guanciale', 'Eggs', 'Pecorino Romano', 'Black pepper'],
      instructions: ['Cook pasta', 'Crisp guanciale', 'Mix eggs and cheese', 'Combine quickly'],
      createdAt: Date.now(),
      imageUrl: undefined,
      rating: 4.6,
      reviewCount: 512,
      userId: 'pasta-lover'
    },
    {
      id: 'curated-6',
      name: 'Avocado Toast Supreme',
      description: 'Elevated breakfast classic with premium toppings',
      category: 'Breakfast',
      prepTime: 10,
      cookTime: 5,
      servings: 2,
      ingredients: ['Sourdough bread', 'Avocado', 'Poached eggs', 'Cherry tomatoes', 'Microgreens', 'Everything bagel seasoning'],
      instructions: ['Toast bread', 'Mash avocado', 'Poach eggs', 'Assemble and garnish'],
      createdAt: Date.now(),
      imageUrl: undefined,
      rating: 4.4,
      reviewCount: 78,
      userId: 'brunch-queen'
    },
    {
      id: 'curated-7',
      name: 'Mexican Street Tacos',
      description: 'Authentic tacos from Oaxaca food markets',
      category: 'Dinner',
      prepTime: 20,
      cookTime: 15,
      servings: 4,
      ingredients: ['Corn tortillas', 'Carne asada', 'Cilantro', 'Onion', 'Lime', 'Salsa verde'],
      instructions: ['Marinate meat', 'Grill carne asada', 'Warm tortillas', 'Assemble tacos'],
      createdAt: Date.now(),
      imageUrl: undefined,
      rating: 4.8,
      reviewCount: 945,
      userId: 'taco-king'
    },
    {
      id: 'curated-8',
      name: 'Green Detox Smoothie',
      description: 'Energizing superfood blend for wellness',
      category: 'Drinks',
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      ingredients: ['Spinach', 'Banana', 'Mango', 'Chia seeds', 'Almond milk', 'Honey'],
      instructions: ['Add all ingredients to blender', 'Blend until smooth', 'Serve immediately'],
      createdAt: Date.now(),
      imageUrl: undefined,
      rating: 4.2,
      reviewCount: 45,
      userId: 'smoothie-bar'
    },
  ]
}

export function Explore({ onViewRecipe, onRate, foodPreferences, userRecipes = [] }: ExploreProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all')

  // Filter categories based on food preferences
  const categories = allCategories.filter(cat => {
    // Always show these base categories
    if (['all', 'recommended', 'most-liked'].includes(cat.id)) return true

    // Show categories that match user preferences (case-insensitive)
    const normalizedPrefs = foodPreferences.map(p => p.toLowerCase())
    return normalizedPrefs.some(pref =>
      cat.label.toLowerCase().includes(pref) ||
      pref.includes(cat.label.toLowerCase())
    )
  })

  // Curated recipes from external sources (chefs, restaurants, etc.)
  // TODO: Replace with API call to fetch curated recipes
  const curatedRecipes = getMockCuratedRecipes()

  // Calculate recipe score based on user preferences
  const calculateRecipeScore = (recipe: Recipe) => {
    if (foodPreferences.length === 0) return 0
    let score = 0
    const normalizedPrefs = foodPreferences.map(p => p.toLowerCase())
    const recipeStr = `${recipe.name} ${recipe.description} ${recipe.category} ${recipe.ingredients.join(' ')}`.toLowerCase()

    normalizedPrefs.forEach(pref => {
      if (recipeStr.includes(pref)) {
        score += 1
        // Bonus for Title or Category match
        if (recipe.name.toLowerCase().includes(pref)) score += 2
        if (recipe.category.toLowerCase().includes(pref)) score += 2
      }
    })
    return score
  }

  // Sort curated recipes by score
  const scoredRecipes = [...curatedRecipes].sort((a, b) => {
    return calculateRecipeScore(b) - calculateRecipeScore(a)
  })

  // Filter recipes by category and cuisine type
  const recommendedRecipes = scoredRecipes.slice(0, 5)
  const mostLikedRecipes = curatedRecipes.slice(2, 7)
  const healthyRecipes = curatedRecipes.filter(r =>
    r.name.includes('Quinoa') || r.name.includes('Smoothie') || r.name.includes('Avocado')
  )
  const thaiRecipes = curatedRecipes.filter(r => r.name.includes('Thai'))
  const indianRecipes = curatedRecipes.filter(r => r.name.includes('Butter Chicken'))
  const koreanRecipes = curatedRecipes.filter(r => r.name.includes('Korean'))
  const italianRecipes = curatedRecipes.filter(r => r.name.includes('Italian') || r.name.includes('Carbonara'))
  const mexicanRecipes = curatedRecipes.filter(r => r.name.includes('Mexican') || r.name.includes('Taco'))

  const filteredRecipes = searchQuery
    ? curatedRecipes.filter(recipe =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : []

  const pastFeasts = userRecipes.filter(r => !r.isSaved)
  const savedRecipes = userRecipes.filter(r => r.isSaved)

  return (
    <div className="h-full space-y-4 pt-0">
      {/* Search Bar + Filter - Sticky at Top */}
      <div
        className="sticky z-40 pb-2 pt-4 px-4 sm:px-6 lg:px-8"
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={20}
                weight="bold"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search for recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 md:h-14 text-base md:text-lg bg-white"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative flex items-center justify-center w-12 h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex-shrink-0">
                  <Funnel size={22} weight={selectedCategory !== 'all' ? 'fill' : 'regular'} className="text-gray-600" />
                  {selectedCategory !== 'all' && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <div className="grid gap-1">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`
                      flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left
                      ${selectedCategory === category.id
                          ? 'bg-neutral-800 text-white'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                        }
                    `}
                    >
                      {category.icon}
                      {category.label}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Recipe Sections - No vertical scrolling */}
      <div className="space-y-6">
        {/* Search Results */}
        {searchQuery && (
          <div className="overflow-y-auto max-h-[calc(100vh-20rem)]">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">
                Search Results ({filteredRecipes.length})
              </h2>
              {filteredRecipes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No recipes found for "{searchQuery}"
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRecipes.map(recipe => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onClick={() => onViewRecipe(recipe)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recipe Carousels - Only show when not searching */}
        {!searchQuery && (
          <>
            {curatedRecipes.length === 0 ? (
              <div className="text-center py-16">
                <Sparkle size={64} weight="thin" className="mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">
                  Curated recipes from celebrity chefs and restaurants will appear here!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Past Feasts Section */}
                {pastFeasts.length > 0 && (
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-4 px-4">
                      <Star size={24} weight="fill" className="text-yellow-500" />
                      <h2 className="text-2xl font-semibold">Past Feasts</h2>
                    </div>
                    <div className="overflow-x-auto pb-6 pt-2 pl-4 scrollbar-hide">
                      <div className="flex gap-4">
                        {pastFeasts.map(recipe => (
                          <div key={recipe.id} className="flex-shrink-0 w-72">
                            <RecipeCard
                              recipe={recipe}
                              onClick={() => onViewRecipe(recipe)}
                              onRate={onRate ? (rating) => onRate(recipe.id, rating) : undefined}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Saved Recipes Section */}
                {savedRecipes.length > 0 && (
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-4 px-4">
                      <BookBookmark size={24} weight="bold" className="text-blue-500" />
                      <h2 className="text-2xl font-semibold">Saved Recipes</h2>
                    </div>
                    <div className="overflow-x-auto pb-6 pt-2 pl-4 scrollbar-hide">
                      <div className="flex gap-4">
                        {savedRecipes.map(recipe => (
                          <div key={recipe.id} className="flex-shrink-0 w-72">
                            <RecipeCard
                              recipe={recipe}
                              onClick={() => onViewRecipe(recipe)}
                              onRate={onRate ? (rating) => onRate(recipe.id, rating) : undefined}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommended Section */}
                {recommendedRecipes.length > 0 && (
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-4 px-4">
                      <Sparkle size={24} weight="fill" className="text-primary" />
                      <h2 className="text-2xl font-semibold">Recommended for You</h2>
                    </div>
                    <div className="overflow-x-auto pb-6 pt-2 pl-4 scrollbar-hide">
                      <div className="flex gap-4">
                        {recommendedRecipes.map(recipe => (
                          <div key={recipe.id} className="flex-shrink-0 w-72">
                            <RecipeCard
                              recipe={recipe}
                              onClick={() => onViewRecipe(recipe)}
                              onRate={onRate ? (rating) => onRate(recipe.id, rating) : undefined}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Most Liked Section */}
                {mostLikedRecipes.length > 0 && (
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-4 px-4">
                      <Heart size={24} weight="fill" className="text-destructive" />
                      <h2 className="text-2xl font-semibold">Most Liked</h2>
                    </div>
                    <div className="overflow-x-auto pb-6 pt-2 pl-4 scrollbar-hide">
                      <div className="flex gap-4">
                        {mostLikedRecipes.map(recipe => (
                          <div key={recipe.id} className="flex-shrink-0 w-72">
                            <RecipeCard
                              recipe={recipe}
                              onClick={() => onViewRecipe(recipe)}
                              onRate={onRate ? (rating) => onRate(recipe.id, rating) : undefined}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Healthy Section */}
                {healthyRecipes.length > 0 && (
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-4 px-4">
                      <Leaf size={24} weight="bold" className="text-green-600" />
                      <h2 className="text-2xl font-semibold">Healthy Options</h2>
                    </div>
                    <div className="overflow-x-auto pb-6 pt-2 pl-4 scrollbar-hide">
                      <div className="flex gap-4">
                        {healthyRecipes.map(recipe => (
                          <div key={recipe.id} className="flex-shrink-0 w-72">
                            <RecipeCard
                              recipe={recipe}
                              onClick={() => onViewRecipe(recipe)}
                              onRate={onRate ? (rating) => onRate(recipe.id, rating) : undefined}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Thai Section */}
                {thaiRecipes.length > 0 && (
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-4 px-4">
                      <CookingPot size={24} weight="bold" className="text-orange-600" />
                      <h2 className="text-2xl font-semibold">Thai Cuisine</h2>
                    </div>
                    <div className="overflow-x-auto pb-6 pt-2 pl-4 scrollbar-hide">
                      <div className="flex gap-4">
                        {thaiRecipes.map(recipe => (
                          <div key={recipe.id} className="flex-shrink-0 w-72">
                            <RecipeCard
                              recipe={recipe}
                              onClick={() => onViewRecipe(recipe)}
                              onRate={onRate ? (rating) => onRate(recipe.id, rating) : undefined}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Indian Section */}
                {indianRecipes.length > 0 && (
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-4 px-4">
                      <CookingPot size={24} weight="bold" className="text-red-600" />
                      <h2 className="text-2xl font-semibold">Indian Cuisine</h2>
                    </div>
                    <div className="overflow-x-auto pb-6 pt-2 pl-4 scrollbar-hide">
                      <div className="flex gap-4">
                        {indianRecipes.map(recipe => (
                          <div key={recipe.id} className="flex-shrink-0 w-72">
                            <RecipeCard recipe={recipe} onClick={() => onViewRecipe(recipe)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Korean Section */}
                {koreanRecipes.length > 0 && (
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-4 px-4">
                      <CookingPot size={24} weight="bold" className="text-rose-600" />
                      <h2 className="text-2xl font-semibold">Korean Cuisine</h2>
                    </div>
                    <div className="overflow-x-auto pb-6 pt-2 pl-4 scrollbar-hide">
                      <div className="flex gap-4">
                        {koreanRecipes.map(recipe => (
                          <div key={recipe.id} className="flex-shrink-0 w-72">
                            <RecipeCard recipe={recipe} onClick={() => onViewRecipe(recipe)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Italian Section */}
                {italianRecipes.length > 0 && (
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-4 px-4">
                      <CookingPot size={24} weight="bold" className="text-emerald-600" />
                      <h2 className="text-2xl font-semibold">Italian Cuisine</h2>
                    </div>
                    <div className="overflow-x-auto pb-6 pt-2 pl-4 scrollbar-hide">
                      <div className="flex gap-4">
                        {italianRecipes.map(recipe => (
                          <div key={recipe.id} className="flex-shrink-0 w-72">
                            <RecipeCard recipe={recipe} onClick={() => onViewRecipe(recipe)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mexican Section */}
                {mexicanRecipes.length > 0 && (
                  <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-4 px-4">
                      <CookingPot size={24} weight="bold" className="text-amber-600" />
                      <h2 className="text-2xl font-semibold">Mexican Cuisine</h2>
                    </div>
                    <div className="overflow-x-auto pb-6 pt-2 pl-4 scrollbar-hide">
                      <div className="flex gap-4">
                        {mexicanRecipes.map(recipe => (
                          <div key={recipe.id} className="flex-shrink-0 w-72">
                            <RecipeCard recipe={recipe} onClick={() => onViewRecipe(recipe)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}