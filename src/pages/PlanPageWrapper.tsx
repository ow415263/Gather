import { useState } from 'react'
import { useRecipes } from '@/hooks/use-recipes'

// Components
import { PlanPage, PlanViewMode } from '@/components/PlanPage'
import { ImportFromRecipesDialog } from '@/components/ImportFromRecipesDialog'

export function PlanPageWrapper() {
    const { recipes } = useRecipes()

    // State
    const [planViewMode, setPlanViewMode] = useState<PlanViewMode>('landing')
    const [importDialogOpen, setImportDialogOpen] = useState(false)
    const [addMealDialogOpen, setAddMealDialogOpen] = useState(false)

    const handleAddIngredientsToShoppingList = (ingredients: string[]) => {
        // We'll use localStorage to pass ingredients to ShoppingList component
        // This is a workaround since ShoppingList manages its own state
        const event = new CustomEvent('add-ingredients', { detail: { ingredients } })
        window.dispatchEvent(event)
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            {/* Note: Plan Page handles its own headers/layout based on viewMode usually */}

            <PlanPage
                recipes={recipes || []}
                addMealDialogOpen={addMealDialogOpen}
                setAddMealDialogOpen={setAddMealDialogOpen}
                onImportFromRecipes={() => setImportDialogOpen(true)}
                viewMode={planViewMode}
                setViewMode={setPlanViewMode}
            />

            <ImportFromRecipesDialog
                open={importDialogOpen}
                onClose={() => setImportDialogOpen(false)}
                recipes={recipes || []}
                onAddToShoppingList={handleAddIngredientsToShoppingList}
            />
        </div>
    )
}
