import { useState, useEffect } from 'react'
import { useShoppingList } from '@/hooks/use-shopping-list'
import { useSpeechRecognition } from '@/hooks/use-speech-recognition'
import { ShoppingListItem } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Plus, Trash, Microphone } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ShoppingListProps {
  onImportFromRecipes?: () => void
}

export function ShoppingList({ onImportFromRecipes }: ShoppingListProps) {
  const {
    items,
    addItem,
    addItems,
    toggleItem,
    deleteItem,
    clearChecked,
    clearAll
  } = useShoppingList()
  const [newItemName, setNewItemName] = useState('')
  const [navHovered, setNavHovered] = useState(false)

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport
  } = useSpeechRecognition()

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setNewItemName(transcript)
    }
  }, [transcript])

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      resetTranscript()
      startListening()
    }
  }

  const itemList = items || []

  // Listen for nav hover events
  useEffect(() => {
    const handleNavHover = (event: any) => {
      setNavHovered(event.detail.isHovered)
    }
    window.addEventListener('nav-hover', handleNavHover)
    return () => window.removeEventListener('nav-hover', handleNavHover)
  }, [])

  // Listen for ingredients to add from import dialog
  useEffect(() => {
    const handleAddIngredients = async (event: any) => {
      const { ingredients } = event.detail
      try {
        await addItems(ingredients)
        toast.success(`Added ${ingredients.length} items to shopping list`)
      } catch (error) {
        toast.error('Failed to add ingredients')
      }
    }

    window.addEventListener('add-ingredients', handleAddIngredients)
    return () => window.removeEventListener('add-ingredients', handleAddIngredients)
  }, [addItems])

  const handleAddItem = async () => {
    if (!newItemName.trim()) return

    try {
      await addItem(newItemName.trim())
      setNewItemName('')
    } catch (error) {
      toast.error('Failed to add item')
    }
  }

  const handleToggleItem = async (itemId: string, currentChecked: boolean) => {
    try {
      await toggleItem(itemId, !currentChecked)
    } catch (error) {
      toast.error('Failed to update item')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem(itemId)
      toast.success('Item removed')
    } catch (error) {
      toast.error('Failed to remove item')
    }
  }

  const handleClearChecked = async () => {
    try {
      await clearChecked()
      toast.success('Checked items cleared')
    } catch (error) {
      toast.error('Failed to clear checked items')
    }
  }

  const handleClearAll = async () => {
    try {
      await clearAll()
      toast.success('Shopping list cleared')
    } catch (error) {
      toast.error('Failed to clear shopping list')
    }
  }

  const checkedCount = itemList.filter(item => item.checked).length
  const totalCount = itemList.length

  // Sort: unchecked items first, then checked items
  const sortedItems = [...itemList].sort((a, b) => {
    if (a.checked === b.checked) return b.createdAt - a.createdAt
    return a.checked ? 1 : -1
  })

  return (
    <div className="space-y-6 pb-32 px-4 md:px-6 pt-6">
      {/* List Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {checkedCount} of {totalCount} items checked
        </p>
        {totalCount > 0 && (
          <Button onClick={handleClearAll} variant="outline" size="sm">
            <Trash size={16} weight="bold" className="mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Shopping List Items */}
      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 -translate-y-16">
          <ShoppingCart size={64} weight="thin" className="mb-6 text-muted-foreground/50" />
          <p className="text-xl font-medium text-muted-foreground mb-8">Your shopping list is empty</p>
          {onImportFromRecipes && (
            <Button
              onClick={onImportFromRecipes}
              size="lg"
              className="bg-primary/10 text-primary hover:bg-primary/20 border-0"
            >
              <Download size={20} weight="bold" className="mr-2" />
              Grab ingredients from recipes
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map(item => (
            <div
              key={item.id}
              onClick={() => handleToggleItem(item.id, item.checked)}
              className={`flex items-center gap-3 p-4 bg-card border border-border rounded-lg transition-all cursor-pointer ${item.checked
                ? 'opacity-50 hover:opacity-60'
                : 'hover:bg-accent/50 hover:border-primary/50'
                }`}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.checked
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground'
                  }`}
              >
                {item.checked && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 text-primary-foreground"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                  {item.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteItem(item.id)
                }}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash size={18} weight="bold" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Fixed Input at Bottom */}
      <div className={`shopping-list-input fixed bottom-[72px] md:bottom-0 left-0 right-0 border-t border-border bg-background transition-all duration-300 z-40 ${navHovered ? 'md:left-52' : 'md:left-20'}`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 pt-6 pb-6 md:pb-[calc(env(safe-area-inset-bottom)+24px)]">
          <div className="flex gap-3 mb-2 relative">
            <div className="relative flex-1">
              <Input
                placeholder={isListening ? "Listening..." : "Add an item..."}
                value={isListening ? (transcript || newItemName) : newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                className={`flex-1 h-12 md:h-14 text-base md:text-lg text-foreground border-2 pr-12 ${isListening ? 'border-primary ring-2 ring-primary/20' : ''}`}
              />
              {hasRecognitionSupport && (
                <button
                  onClick={toggleListening}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors ${isListening
                    ? 'text-primary bg-primary/10 animate-pulse'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                  <Microphone size={20} weight={isListening ? "fill" : "regular"} />
                </button>
              )}
            </div>
            <Button onClick={handleAddItem} disabled={!newItemName.trim() && !transcript} size="lg" className="h-12 md:h-14 w-12 md:w-14 px-0">
              <Plus size={24} weight="bold" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShoppingCart({ size, weight, className }: { size: number; weight: string; className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="currentColor"
      viewBox="0 0 256 256"
      className={className}
    >
      <path d="M222.14,58.87A8,8,0,0,0,216,56H54.68L49.79,29.14A16,16,0,0,0,34.05,16H16a8,8,0,0,0,0,16h18l25.56,140.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,152,204a28,28,0,1,0,28-28H83.17a8,8,0,0,1-7.87-6.57L72.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,222.14,58.87ZM96,204a12,12,0,1,1-12-12A12,12,0,0,1,96,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,192,204Zm4-68H69.22L57.59,72H206.41Z"></path>
    </svg>
  )
}
