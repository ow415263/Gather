import { useState, useMemo, useEffect } from 'react'
import { Plus, PaperPlaneTilt } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useRecipes } from '@/hooks/use-recipes'
import { useUserProfile } from '@/hooks/use-user-profile'
import { usePosts } from '@/hooks/use-posts'
import { Recipe, RecipeCategory } from '@/lib/types'
import { RECIPE_CATEGORIES } from '@/lib/constants'

// Components
import { Explore } from '@/components/Explore'
import { RecipeDialog } from '@/components/RecipeDialog'
import { PhotoRecipeDialog } from '@/components/PhotoRecipeDialog'
import { UrlRecipeDialog } from '@/components/UrlRecipeDialog'
import { RecipeDetail } from '@/components/RecipeDetail'
import { CookingMode } from '@/components/CookingMode'
import { AddRecipeMethodDialog } from '@/components/AddRecipeMethodDialog'
import { RecipePromptDialog } from '@/components/RecipePromptDialog'
import { CreatePostDialog } from '@/components/CreatePostDialog'
import { ReviewDialogWrapper } from '@/components/ReviewDialogWrapper'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

import { cn } from '@/lib/utils'

interface RecipesPageProps {
    sharedUrl?: string | null
    onUrlHandled?: () => void
    hideHeader?: boolean
    className?: string
}

export function RecipesPage({ sharedUrl, onUrlHandled, hideHeader = false, className }: RecipesPageProps) {
    const { currentUser } = useAuth()
    const { recipes, addRecipe, updateRecipe, deleteRecipe } = useRecipes()
    const { profile } = useUserProfile()
    const { createPost } = usePosts()

    // State
    const [searchQuery, setSearchQuery] = useState('')

    // Dialog States
    const [methodDialogOpen, setMethodDialogOpen] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
    const [urlDialogOpen, setUrlDialogOpen] = useState(false)
    const [detailOpen, setDetailOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false)
    const [showPromptDialog, setShowPromptDialog] = useState(false)

    // Review Dialog State (Interactive Stars)
    const [reviewRecipe, setReviewRecipe] = useState<Recipe | null>(null)
    const [reviewInitialRating, setReviewInitialRating] = useState(0)
    const [isReviewWrapperOpen, setIsReviewWrapperOpen] = useState(false)

    // Handle Shared URL
    useEffect(() => {
        if (sharedUrl) {
            console.log('[RecipesPage] Opening URL dialog for:', sharedUrl)
            setUrlDialogOpen(true)
            // We don't call onUrlHandled immediately to keep the prop active 
            // until the dialog receives it, but the dialog uses it in its own useEffect
            // so we can probably clear it now? 
            // Better to let the dialog consume it, but for now we'll just clear
            // it on close or let parent handle?
            // Actually, if we clear it too soon, the dialog might not get it if there's a race.
            // But we're passing it as a prop.
            // Let's call onUrlHandled immediately so we don't re-trigger loops.
            onUrlHandled?.()
        }
    }, [sharedUrl])

    // Selection States
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined)
    const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null)

    // Handlers
    const handleAddRecipe = () => {
        setEditingRecipe(undefined)
        setMethodDialogOpen(true)
    }

    const handleMethodSelect = (method: 'manual' | 'photo' | 'link' | 'prompt') => {
        setMethodDialogOpen(false)
        switch (method) {
            case 'manual':
                setEditingRecipe(undefined)
                setDialogOpen(true)
                break
            case 'photo':
                setEditingRecipe(undefined)
                setPhotoDialogOpen(true)
                break
            case 'link':
                setEditingRecipe(undefined)
                setUrlDialogOpen(true)
                break
            case 'prompt':
                setShowPromptDialog(true)
                break
        }
    }

    const handleEditRecipe = (recipe: Recipe) => {
        setEditingRecipe(recipe)
        setDetailOpen(false)
        setDialogOpen(true)
    }

    const handleSaveRecipe = async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'userId'>) => {
        try {
            if (editingRecipe) {
                await updateRecipe(editingRecipe.id, recipeData)
                toast.success('Recipe updated successfully')
            } else {
                await addRecipe(recipeData)
                toast.success('Recipe added successfully')
            }
            setDialogOpen(false)
            setPhotoDialogOpen(false)
            setUrlDialogOpen(false)
            setEditingRecipe(undefined)
        } catch (error: any) {
            const errorMessage = error.message?.includes('too large')
                ? 'Recipe image is too large. Try a smaller photo.'
                : `Failed to save recipe: ${error.message || 'Unknown error'}`
            toast.error(errorMessage)
        }
    }

    const handleViewRecipe = (recipe: Recipe) => {
        setSelectedRecipe(recipe)
        setDetailOpen(true)
    }

    const handleCookRecipe = (recipe: Recipe) => {
        setDetailOpen(false)
        setCookingRecipe(recipe)
    }

    const handleUpdateRating = async (recipeId: string, rating: number) => {
        // Find the recipe to open the dialog
        const recipe = recipes.find(r => r.id === recipeId) || selectedRecipe
        if (recipe) {
            setReviewRecipe(recipe)
            setReviewInitialRating(rating)
            setIsReviewWrapperOpen(true)
        }
        // We do strictly update the rating immediately? 
        // User asked for "this review thing to be added". 
        // Just opening the dialog is safer than auto-updating without text.
    }

    const handleDeleteClick = () => {
        setDetailOpen(false)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (selectedRecipe) {
            try {
                await deleteRecipe(selectedRecipe.id)
                toast.success('Recipe deleted successfully')
                setDeleteDialogOpen(false)
                setSelectedRecipe(null)
            } catch (error) {
                toast.error('Failed to delete recipe')
            }
        }
    }

    const handleCreatePost = async (
        postData: {
            recipeId?: string
            recipeName?: string
            recipeCategory?: string
            caption?: string
        },
        mediaFile?: File
    ) => {
        if (!currentUser) throw new Error('Must be signed in to create posts')

        const userName = profile.familyCookName || currentUser.displayName || currentUser.email || 'Anonymous'
        const userPhotoUrl = currentUser.photoURL || undefined

        await createPost(
            {
                userId: currentUser.uid,
                userName,
                userPhotoUrl,
                recipeId: postData.recipeId,
                recipeName: postData.recipeName,
                recipeCategory: postData.recipeCategory as RecipeCategory | undefined,
                caption: postData.caption
            },
            mediaFile
        )
    }

    return (
        <div className={cn("min-h-screen bg-background pb-20 md:pb-0", className)}>
            {/* Header */}
            {!hideHeader && (
                <div className="pt-[calc(env(safe-area-inset-top)+24px)] pb-2">
                    <div className="px-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">Recipes</h1>
                            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
                                {currentUser?.displayName || currentUser?.email}
                            </p>
                        </div>
                        <button
                            onClick={handleAddRecipe}
                            className="relative group transition-transform hover:scale-105"
                        >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:bg-muted transition-all">
                                <Plus size={24} weight="bold" />
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="">
                <Explore
                    onViewRecipe={handleViewRecipe}
                    onRate={handleUpdateRating}
                    foodPreferences={profile.foodPreferences || []}
                    userRecipes={recipes || []}
                />
            </div>

            {/* Dialogs */}
            <AddRecipeMethodDialog
                open={methodDialogOpen}
                onClose={() => setMethodDialogOpen(false)}
                onSelectMethod={handleMethodSelect}
            />

            <RecipeDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false)
                    setEditingRecipe(undefined)
                }}
                onSave={handleSaveRecipe}
                recipe={editingRecipe}
            />

            <PhotoRecipeDialog
                open={photoDialogOpen}
                onClose={() => {
                    setPhotoDialogOpen(false)
                    setEditingRecipe(undefined)
                }}
                onSave={handleSaveRecipe}
            />

            <UrlRecipeDialog
                open={urlDialogOpen}
                onClose={() => {
                    setUrlDialogOpen(false)
                    setEditingRecipe(undefined)
                }}
                onSave={handleSaveRecipe}
                initialUrl={sharedUrl}
                autoSave={!!sharedUrl}
            />

            <RecipeDetail
                recipe={selectedRecipe}
                open={detailOpen}
                onClose={() => {
                    setDetailOpen(false)
                    setSelectedRecipe(null)
                }}
                onEdit={() => selectedRecipe && handleEditRecipe(selectedRecipe)}
                onDelete={handleDeleteClick}
                onUpdateRating={handleUpdateRating}
                onCreatePost={(recipe) => {
                    setSelectedRecipe(recipe)
                    setCreatePostDialogOpen(true)
                }}
                onCook={handleCookRecipe}
            />

            <CookingMode
                open={!!cookingRecipe}
                recipe={cookingRecipe}
                onClose={() => setCookingRecipe(null)}
                onEdit={() => {
                    setCookingRecipe(null)
                    if (cookingRecipe) {
                        handleEditRecipe(cookingRecipe)
                    }
                }}
                onComplete={(shouldPost) => {
                    const recipeToPost = cookingRecipe
                    setCookingRecipe(null)
                    if (shouldPost && recipeToPost) {
                        setSelectedRecipe(recipeToPost)
                        setCreatePostDialogOpen(true)
                    }
                }}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{selectedRecipe?.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <CreatePostDialog
                open={createPostDialogOpen}
                onClose={() => setCreatePostDialogOpen(false)}
                onSubmit={handleCreatePost}
                recipes={recipes || []}
                preSelectedRecipe={selectedRecipe || undefined}
            />

            {/* Note: CookDialog/RecipePromptDialog is usually for the "Cook" tab or "Ask Chef" 
                but since MethodSelector has "Prompt" option, we include it here too purely for that flow.
            */}
            <RecipePromptDialog
                open={showPromptDialog}
                onClose={() => setShowPromptDialog(false)}
                onGenerate={(recipe) => {
                    // When generated from here, we go straight to cooking? 
                    // Or detailed view? App.tsx handled it by handleCookRecipe.
                    handleCookRecipe(recipe)
                }}
            />

            <ReviewDialogWrapper
                open={isReviewWrapperOpen}
                initialRating={reviewInitialRating}
                recipe={reviewRecipe}
                onClose={() => {
                    setIsReviewWrapperOpen(false)
                    setReviewRecipe(null)
                }}
            />
        </div>
    )
}
