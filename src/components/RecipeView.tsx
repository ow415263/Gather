import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, Users, Pencil, Trash, Star, Minus, Plus, Camera, Fire, CalendarCheck } from '@phosphor-icons/react'
import { RECIPE_CATEGORIES } from '@/lib/constants'
import { Recipe } from '@/lib/types'
import { useReviews } from '@/hooks/use-reviews'
import { ReviewDialog } from '@/components/ReviewDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'

interface RecipeViewProps {
    recipe: Recipe
    onEdit?: () => void
    onDelete?: () => void
    onUpdateRating?: (recipeId: string, rating: number) => void
    onCreatePost?: (recipe: Recipe) => void
    onCook?: (recipe: Recipe) => void
    isDialog?: boolean // To conditionally render header actions if needed
}

export function RecipeView({ recipe, onEdit, onDelete, onUpdateRating, onCreatePost, onCook, isDialog = false }: RecipeViewProps) {
    const [adjustedServings, setAdjustedServings] = useState<number | null>(null)

    const currentServings = adjustedServings ?? recipe.servings
    const servingMultiplier = currentServings / recipe.servings
    const totalTime = recipe.prepTime + recipe.cookTime

    const handleRatingClick = (rating: number) => {
        onUpdateRating?.(recipe.id, rating)
    }

    const adjustServings = (delta: number) => {
        const newServings = Math.max(1, currentServings + delta)
        setAdjustedServings(newServings)
    }

    const resetServings = () => {
        setAdjustedServings(null)
    }

    // Parse ingredient to extract quantity and scale it
    const scaleIngredient = (ingredient: string): string => {
        if (servingMultiplier === 1) return ingredient

        // Match common quantity patterns (e.g., "2 cups", "1/2 tsp", "3-4 cloves")
        const quantityMatch = ingredient.match(/^(\d+(?:\/\d+)?(?:\.\d+)?(?:\s*-\s*\d+(?:\/\d+)?(?:\.\d+)?)?)\s+/)

        if (quantityMatch) {
            const originalQty = quantityMatch[1]
            let scaledQty: string

            // Handle ranges (e.g., "3-4")
            if (originalQty.includes('-')) {
                const [min, max] = originalQty.split('-').map(n => parseFloat(n.trim()))
                scaledQty = `${(min * servingMultiplier).toFixed(1)}-${(max * servingMultiplier).toFixed(1)}`.replace(/\.0/g, '')
            }
            // Handle fractions (e.g., "1/2")
            else if (originalQty.includes('/')) {
                const [num, denom] = originalQty.split('/').map(n => parseFloat(n.trim()))
                const scaled = (num / denom) * servingMultiplier
                scaledQty = scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(2)
            }
            // Handle decimals and whole numbers
            else {
                const scaled = parseFloat(originalQty) * servingMultiplier
                scaledQty = scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(2)
            }

            return ingredient.replace(originalQty, scaledQty)
        }

        return ingredient
    }

    return (
        <div className="space-y-6">
            {recipe.imageUrl ? (
                <div className="rounded-lg overflow-hidden border-2 border-border relative group">
                    <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className="w-full h-64 object-cover"
                        loading="eager"
                        fetchPriority="high"
                    />
                </div>
            ) : (
                <div className="rounded-lg overflow-hidden border-2 border-border bg-muted/30 h-64 flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
                    <div className="z-10 flex flex-col items-center gap-3 opacity-50">
                        {recipe.category === 'Breakfast' && <Clock size={48} weight="duotone" />}
                        {recipe.category === 'Lunch' && <Users size={48} weight="duotone" />}
                        {recipe.category === 'Dinner' && <Fire size={48} weight="duotone" />}
                        {recipe.category === 'Dessert' && <Star size={48} weight="duotone" />}
                        {recipe.category === 'Snacks' && <Clock size={48} weight="duotone" />}
                        {recipe.category === 'Drinks' && <Clock size={48} weight="duotone" />}


                        // ...

                        {!RECIPE_CATEGORIES.includes(recipe.category as any) && (
                            <Fire size={48} weight="duotone" />
                        )}
                        <p className="font-medium text-lg">{recipe.category || 'Recipe'}</p>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-4 text-sm flex-wrap">
                <Badge variant="secondary">{recipe.category}</Badge>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock size={18} weight="bold" className="text-primary" />
                    <span>
                        {recipe.prepTime > 0 && `${recipe.prepTime} min prep`}
                        {recipe.prepTime > 0 && recipe.cookTime > 0 && ' + '}
                        {recipe.cookTime > 0 && `${recipe.cookTime} min cook`}
                        {(recipe.prepTime === 0 && recipe.cookTime === 0) && `${totalTime} min`}
                    </span>
                </div>
                {recipe.tags && recipe.tags.length > 0 && (
                    <div className="flex items-center gap-2 ml-2">
                        {recipe.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs font-normal">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {recipe.description && (
                <p className="text-muted-foreground leading-relaxed">
                    {recipe.description}
                </p>
            )}

            {/* Rating System */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rate this recipe:</span>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => handleRatingClick(star)}
                            disabled={!onUpdateRating}
                            className={`transition-transform ${onUpdateRating ? 'hover:scale-110 active:scale-95' : 'cursor-default'}`}
                        >
                            <Star
                                size={24}
                                weight={recipe.rating && star <= recipe.rating ? 'fill' : 'regular'}
                                className={recipe.rating && star <= recipe.rating ? 'text-[#AA624D]' : 'text-muted-foreground'}
                            />
                        </button>
                    ))}
                </div>
                {recipe.rating && (
                    <span className="text-sm text-muted-foreground ml-1">
                        {recipe.rating}/5
                    </span>
                )}
            </div>

            {/* Reviews Section */}
            <div className="py-2">
                <ReviewsSection recipe={recipe} />
            </div>

            {/* Main Action Buttons */}
            <div className="flex gap-3">
                <Button
                    onClick={() => onCook && onCook(recipe)}
                    className="flex-1 h-12 text-lg font-bold rounded-xl shadow-md bg-primary hover:bg-primary/90"
                >
                    <Fire size={20} weight="fill" className="mr-2" />
                    Cook It
                </Button>
                <Button
                    variant="outline"
                    className="h-12 w-12 rounded-xl border-2"
                    title="Add to Meal Plan"
                >
                    <CalendarCheck size={20} weight="bold" />
                </Button>
            </div>

            {/* I Made This Button (Secondary) */}
            {onCreatePost && (
                <Button
                    onClick={() => onCreatePost(recipe)}
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground"
                >
                    <Camera size={20} weight="bold" className="mr-2" />
                    I already made this
                </Button>
            )}

            <Separator />

            {/* Serving Size Adjustment */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Servings</h3>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => adjustServings(-1)}
                            disabled={currentServings <= 1}
                        >
                            <Minus size={16} weight="bold" />
                        </Button>
                        <div className="flex items-center gap-2 min-w-[100px] justify-center">
                            <Users size={18} weight="bold" className="text-primary" />
                            <span className="font-semibold">{currentServings}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => adjustServings(1)}
                        >
                            <Plus size={16} weight="bold" />
                        </Button>
                        {adjustedServings !== null && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetServings}
                                className="text-xs"
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
                {adjustedServings !== null && (
                    <p className="text-xs text-muted-foreground">
                        Ingredients scaled from original {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            <Separator />
            <Separator />

            {recipe.courses && recipe.courses.length > 0 ? (
                // Multi-Course Rendering
                <div className="space-y-8">
                    {recipe.courses.map((course, index) => (
                        <div key={index} className="space-y-4">
                            <h3 className="font-bold text-xl text-primary border-b pb-2">{course.name}</h3>

                            <div className="space-y-3">
                                <h4 className="font-semibold text-lg">Ingredients</h4>
                                <ul className="space-y-2">
                                    {course.ingredients.map((ingredient, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                            <span className="text-sm leading-relaxed">{scaleIngredient(ingredient)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold text-lg">Instructions</h4>
                                <ol className="space-y-4">
                                    {course.instructions.map((instruction, i) => (
                                        <li key={i} className="flex gap-3">
                                            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                                                {i + 1}
                                            </div>
                                            <p className="text-sm leading-relaxed pt-1">{instruction}</p>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Standard Single Course Rendering
                <>
                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg">Ingredients</h3>
                        <ul className="space-y-2">
                            {recipe.ingredients.map((ingredient, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                    <span className="text-sm leading-relaxed">{scaleIngredient(ingredient)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <h3 className="font-semibold text-lg">Instructions</h3>
                        <ol className="space-y-4">
                            {recipe.instructions.map((instruction, index) => (
                                <li key={index} className="flex gap-3">
                                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm leading-relaxed pt-1">{instruction}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </>
            )}
            <Separator />


        </div>
    )
}

function ReviewsSection({ recipe }: { recipe: Recipe }) {
    const { currentUser } = useAuth()
    const ownerId = recipe.userId || currentUser?.uid

    const { reviews, loading, addReview } = useReviews(recipe.id, ownerId || '')
    const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)

    const [isExpanded, setIsExpanded] = useState(false)

    if (!ownerId) return null

    const handleAddReview = async (rating: number, text: string, isPublic: boolean) => {
        try {
            await addReview(rating, text, isPublic)
        } catch (error) {
            console.error('Failed to add review:', error)
        }
    }

    return (
        <div className="space-y-4 border rounded-xl p-4 bg-muted/5">
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        Reviews ({recipe.reviewCount || 0})
                        <div className="flex items-center gap-0.5 ml-2">
                            <Star size={16} weight="fill" className="text-orange-400" />
                            <span className="text-sm font-medium">{recipe.rating || 0}</span>
                        </div>
                    </h3>
                </div>
                {/* Chevron or indicator could go here */}
            </div>

            {/* Always show "Write a Review" button if no reviews, or if expanded */}
            {isExpanded && (
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation()
                        setIsReviewDialogOpen(true)
                    }}>
                        Write a Review
                    </Button>
                </div>
            )}

            {isExpanded ? (
                loading ? (
                    <div className="text-sm text-muted-foreground">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-6 bg-muted/20 rounded-lg">
                        <p className="text-muted-foreground mb-2">No reviews yet.</p>
                        <Button variant="outline" size="sm" onClick={() => setIsReviewDialogOpen(true)}>
                            Be the first to review!
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                        {reviews.map((review) => (
                            <div key={review.id} className="flex gap-4 p-3 rounded-lg bg-background border">
                                <Avatar className="w-8 h-8 boundary">
                                    <AvatarImage src={review.userPhotoUrl || undefined} />
                                    <AvatarFallback>{review.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm">{review.userName}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={12}
                                                weight={star <= review.rating ? "fill" : "regular"}
                                                className={star <= review.rating ? "text-orange-400" : "text-muted-foreground/30"}
                                            />
                                        ))}
                                    </div>
                                    {review.text && (
                                        <p className="text-xs text-muted-foreground mt-1">{review.text}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                // Collapsed state: Show preview or nothing
                null
            )}

            <ReviewDialog
                open={isReviewDialogOpen}
                onClose={() => setIsReviewDialogOpen(false)}
                onSubmit={handleAddReview}
            />
        </div>
    )
}
