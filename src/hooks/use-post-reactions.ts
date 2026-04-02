import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Custom hook for managing post reactions (likes, fires, chef hats)
 * Centralizes reaction logic to avoid prop drilling
 */
export function usePostReactions(postIds: string[]) {
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
    const [firedPosts, setFiredPosts] = useState<Set<string>>(new Set())
    const [chefHattedPosts, setChefHattedPosts] = useState<Set<string>>(new Set())
    const { currentUser } = useAuth()

    // Check which posts the current user has reacted to
    useEffect(() => {
        const checkReactions = async () => {
            if (!currentUser || !postIds.length) return

            const likedIds = new Set<string>()
            const firedIds = new Set<string>()
            const chefHattedIds = new Set<string>()

            for (const postId of postIds) {
                const [isLiked, isFired, isChefHatted] = await Promise.all([
                    checkIfLiked(postId),
                    checkIfFired(postId),
                    checkIfChefHatted(postId)
                ])
                if (isLiked) likedIds.add(postId)
                if (isFired) firedIds.add(postId)
                if (isChefHatted) chefHattedIds.add(postId)
            }

            setLikedPosts(likedIds)
            setFiredPosts(firedIds)
            setChefHattedPosts(chefHattedIds)
        }

        checkReactions()
    }, [postIds, currentUser])

    // Check if current user has liked a post
    const checkIfLiked = useCallback(async (postId: string): Promise<boolean> => {
        if (!currentUser) return false

        const likesQuery = query(collection(db, 'posts', postId, 'likes'), where('userId', '==', currentUser.uid))
        try {
            const snapshot = await getDocs(likesQuery)
            return !snapshot.empty
        } catch (err) {
            console.error('[usePostReactions] Error checking like status:', err)
            return false
        }
    }, [currentUser])

    // Check if current user has fired a post
    const checkIfFired = useCallback(async (postId: string): Promise<boolean> => {
        if (!currentUser) return false

        const firesQuery = query(collection(db, 'posts', postId, 'fires'), where('userId', '==', currentUser.uid))
        try {
            const snapshot = await getDocs(firesQuery)
            return !snapshot.empty
        } catch (err) {
            console.error('[usePostReactions] Error checking fire status:', err)
            return false
        }
    }, [currentUser])

    // Check if current user has chef hatted a post
    const checkIfChefHatted = useCallback(async (postId: string): Promise<boolean> => {
        if (!currentUser) return false

        const chefHatsQuery = query(collection(db, 'posts', postId, 'chefHats'), where('userId', '==', currentUser.uid))
        try {
            const snapshot = await getDocs(chefHatsQuery)
            return !snapshot.empty
        } catch (err) {
            console.error('[usePostReactions] Error checking chef hat status:', err)
            return false
        }
    }, [currentUser])

    // Toggle like on a post
    const toggleLike = useCallback(async (postId: string, currentlyLiked: boolean) => {
        if (!currentUser) throw new Error('Must be signed in to react')

        const likeRef = doc(db, 'posts', postId, 'likes', currentUser.uid)
        const postRef = doc(db, 'posts', postId)

        try {
            if (currentlyLiked) {
                await deleteDoc(likeRef)
                await updateDoc(postRef, { likes: increment(-1) })
                setLikedPosts(prev => {
                    const next = new Set(prev)
                    next.delete(postId)
                    return next
                })
            } else {
                await setDoc(likeRef, { userId: currentUser.uid, createdAt: serverTimestamp() })
                await updateDoc(postRef, { likes: increment(1) })
                setLikedPosts(prev => new Set(prev).add(postId))
            }
        } catch (err) {
            console.error('[usePostReactions] Error toggling like:', err)
            throw err
        }
    }, [currentUser])

    // Toggle fire on a post
    const toggleFire = useCallback(async (postId: string, currentlyFired: boolean) => {
        if (!currentUser) throw new Error('Must be signed in to react')

        const fireRef = doc(db, 'posts', postId, 'fires', currentUser.uid)
        const postRef = doc(db, 'posts', postId)

        try {
            if (currentlyFired) {
                await deleteDoc(fireRef)
                await updateDoc(postRef, { fires: increment(-1) })
                setFiredPosts(prev => {
                    const next = new Set(prev)
                    next.delete(postId)
                    return next
                })
            } else {
                await setDoc(fireRef, { userId: currentUser.uid, createdAt: serverTimestamp() })
                await updateDoc(postRef, { fires: increment(1) })
                setFiredPosts(prev => new Set(prev).add(postId))
            }
        } catch (err) {
            console.error('[usePostReactions] Error toggling fire:', err)
            throw err
        }
    }, [currentUser])

    // Toggle chef hat on a post
    const toggleChefHat = useCallback(async (postId: string, currentlyChefHatted: boolean) => {
        if (!currentUser) throw new Error('Must be signed in to react')

        const chefHatRef = doc(db, 'posts', postId, 'chefHats', currentUser.uid)
        const postRef = doc(db, 'posts', postId)

        try {
            if (currentlyChefHatted) {
                await deleteDoc(chefHatRef)
                await updateDoc(postRef, { chefHats: increment(-1) })
                setChefHattedPosts(prev => {
                    const next = new Set(prev)
                    next.delete(postId)
                    return next
                })
            } else {
                await setDoc(chefHatRef, { userId: currentUser.uid, createdAt: serverTimestamp() })
                await updateDoc(postRef, { chefHats: increment(1) })
                setChefHattedPosts(prev => new Set(prev).add(postId))
            }
        } catch (err) {
            console.error('[usePostReactions] Error toggling chef hat:', err)
            throw err
        }
    }, [currentUser])

    return {
        likedPosts,
        firedPosts,
        chefHattedPosts,
        toggleLike,
        toggleFire,
        toggleChefHat,
        isLiked: (postId: string) => likedPosts.has(postId),
        isFired: (postId: string) => firedPosts.has(postId),
        isChefHatted: (postId: string) => chefHattedPosts.has(postId)
    }
}
