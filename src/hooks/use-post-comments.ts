import { useState, useCallback } from 'react'
import { collection, query, orderBy, limit, getDocs, addDoc, deleteDoc, doc, updateDoc, increment, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { PostComment } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Custom hook for managing post comments
 * Centralizes comment logic to avoid prop drilling
 */
export function usePostComments() {
    const [commentsMap, setCommentsMap] = useState<Record<string, PostComment[]>>({})
    const { currentUser } = useAuth()

    // Load comments for a post
    const loadComments = useCallback(async (postId: string) => {
        const commentsQuery = query(
            collection(db, 'posts', postId, 'comments'),
            orderBy('createdAt', 'desc'),
            limit(50)
        )

        try {
            const snapshot = await getDocs(commentsQuery)
            const comments = snapshot.docs.map(doc => {
                const data = doc.data()
                const createdAt = data.createdAt instanceof Timestamp
                    ? data.createdAt.toMillis()
                    : Date.now()
                return { id: doc.id, ...data, createdAt } as PostComment
            })

            setCommentsMap(prev => ({ ...prev, [postId]: comments }))
            return comments
        } catch (err) {
            console.error('[usePostComments] Error fetching comments:', err)
            return []
        }
    }, [])

    // Add a comment to a post
    const addComment = useCallback(async (
        postId: string,
        text: string,
        userName: string,
        userPhotoUrl?: string
    ) => {
        if (!currentUser) throw new Error('Must be signed in to comment')

        const commentsRef = collection(db, 'posts', postId, 'comments')
        const postRef = doc(db, 'posts', postId)

        try {
            const commentData: any = {
                postId,
                userId: currentUser.uid,
                userName,
                text: text.trim(),
                createdAt: serverTimestamp()
            }
            if (userPhotoUrl) commentData.userPhotoUrl = userPhotoUrl

            await addDoc(commentsRef, commentData)
            await updateDoc(postRef, { commentCount: increment(1) })

            // Reload comments to show the new one
            await loadComments(postId)

            console.log('[usePostComments] Comment added')
        } catch (err) {
            console.error('[usePostComments] Error adding comment:', err)
            throw err
        }
    }, [currentUser, loadComments])

    // Delete a comment
    const deleteComment = useCallback(async (postId: string, commentId: string) => {
        if (!currentUser) throw new Error('Must be signed in to delete comments')

        const commentRef = doc(db, 'posts', postId, 'comments', commentId)
        const postRef = doc(db, 'posts', postId)

        try {
            await deleteDoc(commentRef)
            await updateDoc(postRef, { commentCount: increment(-1) })

            // Update local state
            setCommentsMap(prev => ({
                ...prev,
                [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
            }))

            console.log('[usePostComments] Comment deleted')
        } catch (err) {
            console.error('[usePostComments] Error deleting comment:', err)
            throw err
        }
    }, [currentUser])

    return {
        commentsMap,
        loadComments,
        addComment,
        deleteComment,
        getComments: (postId: string) => commentsMap[postId] || []
    }
}
