import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Heart, Trash, Fire, ChefHat, ChatCircle, DotsThree, Star } from '@phosphor-icons/react'
import { CookingPost } from '@/lib/types'
import { CommentsSection } from '@/components/CommentsSection'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/hooks/use-user-profile'
import { usePostReactionContext } from '@/contexts/PostReactionContext'
import { usePostCommentsContext } from '@/contexts/PostCommentsContext'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

const formatDate = (date: number | undefined | null) => {
    if (!date) return 'Just now'
    try {
        return formatDistanceToNow(date, { addSuffix: true })
    } catch (e) {
        return 'Just now'
    }
}

interface FeedPostProps {
    post: CookingPost
    onDelete: (postId: string) => void
    onRecipeClick: (recipeId: string) => void
}

export function FeedPost({
    post,
    onDelete,
    onRecipeClick
}: FeedPostProps) {
    const { currentUser } = useAuth()
    const { profile } = useUserProfile()
    const reactions = usePostReactionContext()
    const comments = usePostCommentsContext()

    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [commentsOpen, setCommentsOpen] = useState(false)

    // Get state from contexts
    const isLiked = reactions.isLiked(post.id)
    const isFired = reactions.isFired(post.id)
    const isChefHatted = reactions.isChefHatted(post.id)
    const postComments = comments.getComments(post.id)

    const isOwner = currentUser?.uid === post.userId
    const userInitial = post.userName?.[0]?.toUpperCase() || 'U'

    const handleDeleteClick = () => {
        setShowDeleteDialog(true)
    }

    const handleDeleteConfirm = () => {
        onDelete(post.id)
        setShowDeleteDialog(false)
    }

    const handleAddComment = async (text: string) => {
        const userName = profile.familyCookName || currentUser?.displayName || currentUser?.email || 'Anonymous'
        const userPhotoUrl = currentUser?.photoURL || undefined
        await comments.addComment(post.id, text, userName, userPhotoUrl)
    }

    const handleDeleteComment = async (commentId: string) => {
        await comments.deleteComment(post.id, commentId)
    }

    const handleLoadComments = () => {
        comments.loadComments(post.id)
    }

    // Mock rating - in real app would come from recipe data
    const recipeRating = post.recipeId ? 4.5 : null

    return (
        <>
            {/* Full-width post container */}
            <div className="w-full mb-6">
                {/* User info header */}
                <div className="px-4 py-3 flex items-center justify-between">
                    <Link
                        to={`/user/${post.userId}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={post.userPhotoUrl} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {userInitial}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-sm">{post.userName}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatDate(post.createdAt)}
                            </p>
                        </div>
                    </Link>
                    {isOwner && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDeleteClick}
                            className="h-8 w-8"
                        >
                            <DotsThree size={24} weight="bold" />
                        </Button>
                    )}
                </div>

                {/* Full-width media with reactions overlay */}
                {(post.imageUrl || post.videoUrl) && (
                    <div className="relative w-full bg-black">
                        {post.imageUrl && (
                            <img
                                src={post.imageUrl}
                                alt={post.recipeName || 'Post image'}
                                className="w-full h-auto object-contain"
                                style={{ aspectRatio: 'auto' }}
                            />
                        )}
                        {post.videoUrl && (
                            <video
                                src={post.videoUrl}
                                controls
                                className="w-full h-auto object-contain"
                            />
                        )}

                        {/* Reactions overlay - bottom center */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/50 backdrop-blur-sm rounded-full px-6 py-2.5">
                            {/* Fire */}
                            <button
                                onClick={() => reactions.toggleFire(post.id, isFired)}
                                className="transition-transform active:scale-95"
                            >
                                <Fire
                                    size={24}
                                    weight={isFired ? 'fill' : 'regular'}
                                    className={isFired ? 'text-orange-500' : 'text-white'}
                                />
                            </button>

                            {/* Heart */}
                            <button
                                onClick={() => reactions.toggleLike(post.id, isLiked)}
                                className="transition-transform active:scale-95"
                            >
                                <Heart
                                    size={24}
                                    weight={isLiked ? 'fill' : 'regular'}
                                    className={isLiked ? 'text-red-500' : 'text-white'}
                                />
                            </button>

                            {/* Chef Hat */}
                            <button
                                onClick={() => reactions.toggleChefHat(post.id, isChefHatted)}
                                className="transition-transform active:scale-95"
                            >
                                <ChefHat
                                    size={24}
                                    weight={isChefHatted ? 'fill' : 'regular'}
                                    className={isChefHatted ? 'text-yellow-400' : 'text-white'}
                                />
                            </button>
                        </div>
                    </div>
                )}

                {/* Post content below photo */}
                <div className="px-4 py-3 space-y-2">
                    {/* Caption */}
                    {post.caption && (
                        <p className="text-sm leading-relaxed">
                            <span className="font-semibold mr-2">{post.userName}</span>
                            {post.caption}
                        </p>
                    )}

                    {/* Recipe info and rating */}
                    {post.recipeName && (
                        <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2">
                                {recipeRating && (
                                    <div className="flex items-center gap-1 text-sm">
                                        <Star size={16} weight="fill" className="text-yellow-500" />
                                        <span className="font-semibold">{recipeRating}</span>
                                    </div>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => post.recipeId && onRecipeClick(post.recipeId)}
                                    className="h-8"
                                >
                                    View Recipe
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Comment button */}
                    <button
                        onClick={() => {
                            handleLoadComments()
                            setCommentsOpen(true)
                        }}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ChatCircle size={20} weight="bold" />
                        {post.commentCount > 0 ? (
                            <span>View all {post.commentCount} comments</span>
                        ) : (
                            <span>Add a comment</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Comments Drawer */}
            <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
                <SheetContent side="bottom" className="h-[50vh] p-0 flex flex-col">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle>Comments</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-hidden">
                        <CommentsSection
                            postId={post.id}
                            commentCount={post.commentCount || 0}
                            comments={postComments}
                            onAddComment={handleAddComment}
                            onDeleteComment={handleDeleteComment}
                            onLoadComments={handleLoadComments}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this post? This action cannot be undone.
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
        </>
    )
}
