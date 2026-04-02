import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock, Users, Pencil, Trash, Star, Minus, Plus, Camera, Fire, CalendarCheck, X } from '@phosphor-icons/react'
import { Recipe } from '@/lib/types'
import { RecipeView } from './RecipeView'

interface RecipeDetailProps {
  recipe: Recipe | null
  open: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onUpdateRating: (recipeId: string, rating: number) => void
  onCreatePost?: (recipe: Recipe) => void
  onCook?: (recipe: Recipe) => void
}

export function RecipeDetail({ recipe, open, onClose, onEdit, onDelete, onUpdateRating, onCreatePost, onCook }: RecipeDetailProps) {
  if (!recipe) return null

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      {/* [&>button]:hidden hides the default Radix Dialog Close button so we can position our own */}
      <DialogContent className="max-w-full sm:max-w-3xl h-full sm:h-[90vh] flex flex-col p-0 border-0 sm:border rounded-none sm:rounded-lg [&>button]:!hidden">

        {/* ACTION HEADER: Edit/Delete Left, Close Right */}
        <div className="flex-none px-6 pt-[calc(env(safe-area-inset-top)+20px)] sm:pt-6 pb-2 flex items-center justify-between bg-background z-20">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit} className="rounded-full w-10 h-10 hover:bg-muted">
              <Pencil size={20} weight="bold" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="rounded-full w-10 h-10 hover:bg-muted hover:text-destructive">
              <Trash size={20} weight="bold" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full w-10 h-10 hover:bg-muted">
            <X size={20} weight="bold" />
          </Button>
        </div>

        {/* TITLE & CONTENT HEADER */}
        <div className="flex-none px-6 pb-4 bg-background z-20">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-3xl leading-tight text-left">
              {recipe.name}
            </DialogTitle>
            {recipe.description && (
              <p className="text-muted-foreground text-left">
                {recipe.description}
              </p>
            )}
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          <RecipeView
            recipe={recipe}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateRating={onUpdateRating}
            onCreatePost={onCreatePost}
            onCook={onCook}
            isDialog={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
