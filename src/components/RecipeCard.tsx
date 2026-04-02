import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, Star } from '@phosphor-icons/react'
import { Recipe } from '@/lib/types'
import { motion } from 'framer-motion'
import { getCategoryImage } from '@/lib/categoryImages'

interface RecipeCardProps {
  recipe: Recipe
  onClick: () => void
  onRate?: (rating: number) => void
  userId?: string // To check ownership or context if needed
  className?: string
}

export function RecipeCard({ recipe, onClick, className, onRate }: RecipeCardProps) {
  const totalTime = recipe.prepTime + recipe.cookTime
  const displayImage = recipe.imageUrl || getCategoryImage(recipe.category)

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card
        onClick={onClick}
        className="cursor-pointer overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col"
      >
        <div className="h-48 overflow-hidden relative">
          <img
            src={displayImage}
            alt={recipe.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            <Badge variant="secondary" className="backdrop-blur-md bg-white/50 dark:bg-black/50 border-0">
              {recipe.category}
            </Badge>
            {recipe.tags && recipe.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="backdrop-blur-md bg-white/30 dark:bg-black/30 border-0 text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-3 flex-1 flex flex-col">
          <div className="space-y-2 flex-1">
            <h3 className="font-semibold text-lg line-clamp-1">
              {recipe.name}
            </h3>
            {recipe.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {recipe.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3 mt-auto">
            <div className="flex items-center gap-1.5">
              <Clock size={16} weight="bold" className="text-primary" />
              <span>{totalTime}m</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={16} weight="bold" className="text-primary" />
              <span>{recipe.servings}</span>
            </div>
            {onRate ? (
              <div
                className="flex items-center gap-0.5 ml-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => onRate(star)}
                    className="hover:scale-110 transition-transform focus:outline-none p-0.5"
                  >
                    <Star
                      size={16}
                      weight={recipe.rating && star <= recipe.rating ? "fill" : "regular"}
                      className={recipe.rating && star <= recipe.rating ? "text-orange-400" : "text-muted-foreground/30 hover:text-orange-300"}
                    />
                  </button>
                ))}
                <span className="text-xs ml-1 font-medium">{recipe.rating || 0}</span>
              </div>
            ) : (
              recipe.rating && (
                <div className="flex items-center gap-1 ml-auto">
                  <Star size={16} weight="fill" className="text-orange-400" />
                  <span>{recipe.rating}</span>
                </div>
              )
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
