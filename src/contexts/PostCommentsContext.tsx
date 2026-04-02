import { createContext, useContext, ReactNode } from 'react'
import { usePostComments } from '@/hooks/use-post-comments'
import { PostComment } from '@/lib/types'

interface PostCommentsContextType {
    commentsMap: Record<string, PostComment[]>
    loadComments: (postId: string) => Promise<PostComment[]>
    addComment: (postId: string, text: string, userName: string, userPhotoUrl?: string) => Promise<void>
    deleteComment: (postId: string, commentId: string) => Promise<void>
    getComments: (postId: string) => PostComment[]
}

const PostCommentsContext = createContext<PostCommentsContextType | undefined>(undefined)

interface PostCommentsProviderProps {
    children: ReactNode
}

export function PostCommentsProvider({ children }: PostCommentsProviderProps) {
    const comments = usePostComments()

    return (
        <PostCommentsContext.Provider value={comments}>
            {children}
        </PostCommentsContext.Provider>
    )
}

export function usePostCommentsContext() {
    const context = useContext(PostCommentsContext)
    if (!context) {
        throw new Error('usePostCommentsContext must be used within PostCommentsProvider')
    }
    return context
}
