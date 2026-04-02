import { createContext, useContext, ReactNode } from 'react'
import { usePostReactions } from '@/hooks/use-post-reactions'

interface PostReactionContextType {
    likedPosts: Set<string>
    firedPosts: Set<string>
    chefHattedPosts: Set<string>
    toggleLike: (postId: string, currentlyLiked: boolean) => Promise<void>
    toggleFire: (postId: string, currentlyFired: boolean) => Promise<void>
    toggleChefHat: (postId: string, currentlyChefHatted: boolean) => Promise<void>
    isLiked: (postId: string) => boolean
    isFired: (postId: string) => boolean
    isChefHatted: (postId: string) => boolean
}

const PostReactionContext = createContext<PostReactionContextType | undefined>(undefined)

interface PostReactionProviderProps {
    postIds: string[]
    children: ReactNode
}

export function PostReactionProvider({ postIds, children }: PostReactionProviderProps) {
    const reactions = usePostReactions(postIds)

    return (
        <PostReactionContext.Provider value={reactions}>
            {children}
        </PostReactionContext.Provider>
    )
}

export function usePostReactionContext() {
    const context = useContext(PostReactionContext)
    if (!context) {
        throw new Error('usePostReactionContext must be used within PostReactionProvider')
    }
    return context
}
