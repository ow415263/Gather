import { useState } from 'react'
import { Recipe, ShoppingListItem } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface IngredientItem {
  ingredient: string
  recipeId: string
  recipeName: string
  inKitchen: boolean
}

interface ImportFromRecipesDialogProps {
  open: boolean
  onClose: () => void
  recipes: Recipe[]
  onAddToShoppingList: (ingredients: string[]) => void
}

export function ImportFromRecipesDialog({ 
  open, 
  onClose, 
  recipes,
  onAddToShoppingList 
}: ImportFromRecipesDialogProps) {
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set())
  const [ingredientStatus, setIngredientStatus] = useState<Map<string, boolean>>(new Map())
  const [step, setStep] = useState<'select-recipes' | 'mark-ingredients'>('select-recipes')

  const handleRecipeToggle = (recipeId: string) => {
    const newSelected = new Set(selectedRecipes)
    if (newSelected.has(recipeId)) {
      newSelected.delete(recipeId)
    } else {
      newSelected.add(recipeId)
    }
    setSelectedRecipes(newSelected)
  }

  const handleNextStep = () => {
    if (selectedRecipes.size === 0) {
      toast.error('Please select at least one recipe')
      return
    }
    setStep('mark-ingredients')
  }

  const handleIngredientToggle = (ingredient: string) => {
    const newStatus = new Map(ingredientStatus)
    newStatus.set(ingredient, !newStatus.get(ingredient))
    setIngredientStatus(newStatus)
  }

  const handleAddToList = () => {
    const ingredientsToAdd = allIngredients
      .filter(item => !ingredientStatus.get(item.ingredient))
      .map(item => item.ingredient)
    
    if (ingredientsToAdd.length === 0) {
      toast.error('No ingredients to add - you have everything!')
      return
    }

    onAddToShoppingList(ingredientsToAdd)
    toast.success(`Added ${ingredientsToAdd.length} ingredients to shopping list`)
    handleClose()
  }

  const handleClose = () => {
    setSelectedRecipes(new Set())
    setIngredientStatus(new Map())
    setStep('select-recipes')
    onClose()
  }

  const selectedRecipesList = recipes.filter(r => selectedRecipes.has(r.id))
  
  const allIngredients: IngredientItem[] = selectedRecipesList.flatMap(recipe =>
    recipe.ingredients.map(ingredient => ({
      ingredient,
      recipeId: recipe.id,
      recipeName: recipe.name,
      inKitchen: ingredientStatus.get(ingredient) || false
    }))
  )

  // Remove duplicates
  const uniqueIngredients = Array.from(
    new Map(allIngredients.map(item => [item.ingredient.toLowerCase(), item])).values()
  )

  const inKitchenCount = uniqueIngredients.filter(item => ingredientStatus.get(item.ingredient)).length
  const needToBuyCount = uniqueIngredients.length - inKitchenCount

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0">
        <div className="px-6 pt-6">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {step === 'select-recipes' ? 'Select Recipes' : 'What\'s in Your Kitchen?'}
            </DialogTitle>
            {step === 'mark-ingredients' && (
              <p className="text-sm text-muted-foreground">
                Check the ingredients you already have
              </p>
            )}
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="space-y-3 pb-20">
              {step === 'select-recipes' ? (
                <div className="space-y-3">
                  {recipes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No recipes yet. Add some recipes first!
                    </p>
                  ) : (
                    recipes.map(recipe => (
                      <div
                        key={recipe.id}
                        onClick={() => handleRecipeToggle(recipe.id)}
                        className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedRecipes.has(recipe.id)}
                          onCheckedChange={() => handleRecipeToggle(recipe.id)}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{recipe.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {recipe.ingredients.length} ingredients
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {uniqueIngredients.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleIngredientToggle(item.ingredient)}
                      className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={ingredientStatus.get(item.ingredient) || false}
                        onCheckedChange={() => handleIngredientToggle(item.ingredient)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.ingredient}</p>
                        <p className="text-xs text-muted-foreground">
                          from {item.recipeName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-background border-t z-10 px-6 py-4">
          {step === 'select-recipes' ? (
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleNextStep} disabled={selectedRecipes.size === 0}>
                Next ({selectedRecipes.size} selected)
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Need to buy: <span className="text-foreground">{needToBuyCount}</span>
              </span>
              <Button onClick={handleAddToList} disabled={needToBuyCount === 0}>
                Add to Shopping List
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
