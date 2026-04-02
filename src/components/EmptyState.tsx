import { Button } from '@/components/ui/button'
import { CookingPot, Plus } from '@phosphor-icons/react'

interface EmptyStateProps {
  isSearching?: boolean
  onAddRecipe?: () => void
}

export function EmptyState({ isSearching, onAddRecipe }: EmptyStateProps) {
  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <CookingPot size={48} weight="duotone" className="text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No recipes found</h3>
        <p className="text-muted-foreground text-center max-w-sm">
          Try adjusting your search or filters to find what you're looking for
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
        <CookingPot size={48} weight="duotone" className="text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Your Foodi collection is empty</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        Start building your collection by adding your first recipe
      </p>
      {onAddRecipe && (
        <Button onClick={onAddRecipe} size="lg">
          <Plus size={20} weight="bold" />
          Add Your First Recipe
        </Button>
      )}
    </div>
  )
}
