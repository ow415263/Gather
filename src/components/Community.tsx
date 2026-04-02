import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FeedPost } from '@/components/FeedPost'
import { usePosts } from '@/hooks/use-posts'
import { PostReactionProvider } from '@/contexts/PostReactionContext'
import { PostCommentsProvider } from '@/contexts/PostCommentsContext'
import { Recipe } from '@/lib/types'

interface CommunityProps {
    onViewRecipe: (recipe: Recipe) => void
    onCreatePost: () => void
}

export function Community({ onViewRecipe, onCreatePost }: CommunityProps) {
    const { posts, loading, deletePost } = usePosts()
    const [filter, setFilter] = useState<'friends' | 'randos'>('randos')
    const navigate = useNavigate()

    const handleRecipeClick = (recipeId: string) => {
        const post = posts.find(p => p.recipeId === recipeId)
        if (post?.recipeId) {
            // In future, fetch recipe by ID and call onViewRecipe
            console.log('Recipe clicked:', recipeId)
        }
    }

    const handleDelete = async (postId: string) => {
        try {
            await deletePost(postId)
        } catch (error) {
            console.error('Error deleting post:', error)
        }
    }

    // Filter posts based on selected filter
    const filteredPosts = posts.filter(post => {
        // For now, show all posts as we don't have friends functionality yet
        // In the future, filter based on friends list
        return true
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        )
    }

    // Get all post IDs for the reaction provider
    const postIds = filteredPosts.map(p => p.id)

    return (
        <div className="space-y-3">
            {/* Filter Toggle */}
            <div className="max-w-3xl mx-auto px-2 sm:px-4 py-2">
                <div className="flex gap-4 ml-2">
                    <button
                        onClick={() => setFilter('friends')}
                        className={`text-sm transition-all ${filter === 'friends'
                            ? 'text-foreground font-bold border-b-2 border-dotted border-foreground'
                            : 'text-muted-foreground'
                            }`}
                    >
                        Friends
                    </button>
                    <button
                        onClick={() => setFilter('randos')}
                        className={`text-sm transition-all ${filter === 'randos'
                            ? 'text-foreground font-bold border-b-2 border-dotted border-foreground'
                            : 'text-muted-foreground'
                            }`}
                    >
                        Randos
                    </button>
                </div>
            </div>

            {/* Feed Posts - Wrapped in Context Providers */}
            {filteredPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <p className="text-muted-foreground mb-4">No posts yet</p>
                    <button
                        onClick={onCreatePost}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Create Your First Post
                    </button>
                </div>
            ) : (
                <PostReactionProvider postIds={postIds}>
                    <PostCommentsProvider>
                        {filteredPosts.map((post) => (
                            <FeedPost
                                key={post.id}
                                post={post}
                                onDelete={handleDelete}
                                onRecipeClick={handleRecipeClick}
                            />
                        ))}
                    </PostCommentsProvider>
                </PostReactionProvider>
            )}
        </div>
    )
}
