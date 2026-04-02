import { useState } from 'react'
import { Plus, PaperPlaneTilt } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { usePosts } from '@/hooks/use-posts'
import { useRecipes } from '@/hooks/use-recipes'
import { useUserProfile } from '@/hooks/use-user-profile'
import { RecipeCategory, Recipe } from '@/lib/types'

// Components
import { Community } from '@/components/Community'
import { CreatePostDialog } from '@/components/CreatePostDialog'
import { RecipeDetail } from '@/components/RecipeDetail'
import { CookingMode } from '@/components/CookingMode'
import { RecipeDialog } from '@/components/RecipeDialog'

export function CommunityPage() {
    const { currentUser } = useAuth()
    const { createPost } = usePosts()
    const { recipes } = useRecipes() // For select recipe in CreatePost
    const { profile } = useUserProfile()

    // State
    const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false)

    // View Recipe State
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null)
    // Note: Edit/Delete/Rating not fully supported here or needs handlers. 
    // We'll stub them for now or implement if critical.

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

    const handleViewRecipe = (recipe: Recipe) => {
        setSelectedRecipe(recipe)
        setDetailOpen(true)
    }

    const handleCookRecipe = (recipe: Recipe) => {
        setDetailOpen(false)
        setCookingRecipe(recipe)
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            {/* Header */}
            <div className="pt-[calc(env(safe-area-inset-top)+24px)] pb-2">
                <div className="px-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">Foodiez</h1>
                        <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
                            {currentUser?.displayName || currentUser?.email}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCreatePostDialogOpen(true)}
                            className="relative group transition-transform hover:scale-105"
                        >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:bg-muted transition-all">
                                <Plus size={24} weight="bold" />
                            </div>
                        </button>
                        <button
                            onClick={() => {/* DM feature */ }}
                            className="relative group transition-transform hover:scale-105"
                        >
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:bg-muted transition-all">
                                <PaperPlaneTilt size={24} weight="bold" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Community
                    onViewRecipe={handleViewRecipe}
                    onCreatePost={() => setCreatePostDialogOpen(true)}
                />
            </div>

            {/* Dialogs */}
            <CreatePostDialog
                open={createPostDialogOpen}
                onClose={() => setCreatePostDialogOpen(false)}
                onSubmit={handleCreatePost}
                recipes={recipes || []}
                preSelectedRecipe={undefined}
            />

            <RecipeDetail
                recipe={selectedRecipe}
                open={detailOpen}
                onClose={() => {
                    setDetailOpen(false)
                    setSelectedRecipe(null)
                }}
                onEdit={() => {
                    toast.info("Editing community recipes is not supported yet.")
                }}
                onDelete={() => {
                    // Stub
                }}
                onUpdateRating={() => {
                    // Stub
                }}
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
                onEdit={() => setCookingRecipe(null)}
                onComplete={(shouldPost) => {
                    const recipeToPost = cookingRecipe
                    setCookingRecipe(null)
                    if (shouldPost && recipeToPost) {
                        setSelectedRecipe(recipeToPost)
                        setCreatePostDialogOpen(true)
                    }
                }}
            />
        </div>
    )
}
