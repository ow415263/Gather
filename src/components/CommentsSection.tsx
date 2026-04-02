import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash, PaperPlaneTilt } from '@phosphor-icons/react'
import { PostComment } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'

interface CommentsSectionProps {
    postId: string
    commentCount: number
    comments: PostComment[]
    onAddComment: (text: string) => Promise<void>
    onDeleteComment: (commentId: string) => Promise<void>
    onLoadComments: () => void
}

export function CommentsSection({
    postId,
    commentCount,
    comments,
    onAddComment,
    onDeleteComment,
    onLoadComments
}: CommentsSectionProps) {
    const { currentUser } = useAuth()
    const [newComment, setNewComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        // Auto-load comments when section mounts
        if (comments.length === 0 && commentCount > 0) {
            onLoadComments()
        }
    }, [comments.length, commentCount, onLoadComments])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newComment.trim() || isSubmitting) return

        try {
            setIsSubmitting(true)
            await onAddComment(newComment.trim())
            setNewComment('')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (commentId: string) => {
        await onDeleteComment(commentId)
    }

    return (
        <div className="flex flex-col h-full">
            {/* Scrollable Comments List */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No comments yet. Be the first to comment!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {comments.map(comment => (
                            <div key={comment.id} className="flex gap-2 group">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src={comment.userPhotoUrl} />
                                    <AvatarFallback className="text-xs bg-muted">
                                        {comment.userName?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm">
                                        <span className="font-semibold mr-2">{comment.userName}</span>
                                        {comment.text}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                                    </p>
                                </div>
                                {currentUser?.uid === comment.userId && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDelete(comment.id)}
                                    >
                                        <Trash size={14} />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Comment Form - Fixed at Bottom with 16px gutter and 20px bottom padding */}
            <div className="border-t bg-background">
                <form onSubmit={handleSubmit} className="flex gap-2 px-4 pb-5 pt-3">
                    <Input
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 h-10"
                        maxLength={500}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        disabled={!newComment.trim() || isSubmitting}
                        className="h-10 w-10"
                    >
                        <PaperPlaneTilt size={20} weight="fill" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
