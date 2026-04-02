import { useState, useEffect, useCallback } from 'react'
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    orderBy,
    Timestamp,
    serverTimestamp,
    setDoc,
    getDocs,
    increment,
    updateDoc,
    limit
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { CookingPost, PostLike, PostComment } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'

export function usePosts() {
    const [posts, setPosts] = useState<CookingPost[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const { currentUser } = useAuth()

    // Subscribe to all posts
    useEffect(() => {
        if (!currentUser) {
            setPosts([])
            setLoading(false)
            return
        }

        const postsRef = collection(db, 'posts')
        const q = query(postsRef, orderBy('createdAt', 'desc'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postData: CookingPost[] = []
            snapshot.forEach((doc) => {
                const data = doc.data()
                const createdAt = data.createdAt instanceof Timestamp
                    ? data.createdAt.toMillis()
                    : Date.now()

                postData.push({
                    ...data,
                    id: doc.id,
                    createdAt
                } as CookingPost)
            })
            setPosts(postData)
            setLoading(false)
        }, (err) => {
            console.error('Error fetching posts:', err)
            setError(err as Error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [currentUser])

    // Create a new post
    const createPost = useCallback(async (
        postData: Omit<CookingPost, 'id' | 'createdAt' | 'likes' | 'fires' | 'chefHats' | 'commentCount'>,
        mediaFile?: File
    ) => {
        if (!currentUser) throw new Error('Must be signed in to create posts')

        console.log('[usePosts] Creating post:', postData.recipeName || 'No recipe linked')

        let mediaUrl: string | undefined

        // Upload media file to Firebase Storage if provided
        if (mediaFile) {
            try {
                const fileExtension = mediaFile.name.split('.').pop()
                const fileName = `posts/${currentUser.uid}/${Date.now()}.${fileExtension}`
                const storageRef = ref(storage, fileName)

                console.log('[usePosts] Uploading media to:', fileName)
                await uploadBytes(storageRef, mediaFile)
                mediaUrl = await getDownloadURL(storageRef)
                console.log('[usePosts] Media uploaded successfully')
            } catch (err) {
                console.error('[usePosts] Error uploading media:', err)
                throw new Error('Failed to upload media')
            }
        }

        // Determine if it's an image or video
        const isVideo = mediaFile?.type.startsWith('video/')

        try {
            const postsRef = collection(db, 'posts')

            // Filter out undefined values from postData to prevent Firebase errors
            const cleanedPostData = Object.fromEntries(
                Object.entries(postData).filter(([_, value]) => value !== undefined)
            )

            // Build post data object, only including media URLs if they exist
            const postDataToSave: any = {
                ...cleanedPostData,
                likes: 0,
                fires: 0,
                chefHats: 0,
                commentCount: 0,
                createdAt: serverTimestamp()
            }

            // Only add imageUrl or videoUrl if mediaUrl exists
            if (mediaUrl) {
                if (isVideo) {
                    postDataToSave.videoUrl = mediaUrl
                } else {
                    postDataToSave.imageUrl = mediaUrl
                }
            }

            const docRef = await addDoc(postsRef, postDataToSave)
            console.log('[usePosts] Post created successfully with ID:', docRef.id)
        } catch (err) {
            console.error('[usePosts] Error creating post:', err)
            throw err
        }
    }, [currentUser])

    // Delete a post
    const deletePost = useCallback(async (postId: string) => {
        if (!currentUser) throw new Error('Must be signed in to delete posts')

        console.log('[usePosts] Deleting post:', postId)
        const postRef = doc(db, 'posts', postId)
        try {
            await deleteDoc(postRef)
            console.log('[usePosts] Post deleted successfully')
        } catch (err) {
            console.error('[usePosts] Error deleting post:', err)
            throw err
        }
    }, [currentUser])

    // Toggle like on a post
    const toggleLike = useCallback(async (postId: string, currentlyLiked: boolean) => {
        if (!currentUser) throw new Error('Must be signed in to like posts')

        const likeRef = doc(db, 'posts', postId, 'likes', currentUser.uid)
        const postRef = doc(db, 'posts', postId)

        try {
            if (currentlyLiked) {
                // Unlike: delete like document and decrement count
                await deleteDoc(likeRef)
                await updateDoc(postRef, {
                    likes: increment(-1)
                })
                console.log('[usePosts] Post unliked')
            } else {
                // Like: create like document and increment count
                await setDoc(likeRef, {
                    userId: currentUser.uid,
                    createdAt: serverTimestamp()
                })
                await updateDoc(postRef, {
                    likes: increment(1)
                })
                console.log('[usePosts] Post liked')
            }
        } catch (err) {
            console.error('[usePosts] Error toggling like:', err)
            throw err
        }
    }, [currentUser])

    // Check if current user has liked a post
    const checkIfLiked = useCallback(async (postId: string): Promise<boolean> => {
        if (!currentUser) return false

        const likesQuery = query(collection(db, 'posts', postId, 'likes'), where('userId', '==', currentUser.uid))

        try {
            const snapshot = await getDocs(likesQuery)
            return !snapshot.empty
        } catch (err) {
            console.error('[usePosts] Error checking like status:', err)
            return false
        }
    }, [currentUser])

    // Toggle fire reaction on a post
    const toggleFire = useCallback(async (postId: string, currentlyFired: boolean) => {
        if (!currentUser) throw new Error('Must be signed in to react')

        const fireRef = doc(db, 'posts', postId, 'fires', currentUser.uid)
        const postRef = doc(db, 'posts', postId)

        try {
            if (currentlyFired) {
                await deleteDoc(fireRef)
                await updateDoc(postRef, { fires: increment(-1) })
                console.log('[usePosts] Fire removed')
            } else {
                await setDoc(fireRef, { userId: currentUser.uid, createdAt: serverTimestamp() })
                await updateDoc(postRef, { fires: increment(1) })
                console.log('[usePosts] Fire added')
            }
        } catch (err) {
            console.error('[usePosts] Error toggling fire:', err)
            throw err
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
            console.error('[usePosts] Error checking fire status:', err)
            return false
        }
    }, [currentUser])

    // Toggle chef hat reaction on a post
    const toggleChefHat = useCallback(async (postId: string, currentlyChefHatted: boolean) => {
        if (!currentUser) throw new Error('Must be signed in to react')

        const chefHatRef = doc(db, 'posts', postId, 'chefHats', currentUser.uid)
        const postRef = doc(db, 'posts', postId)

        try {
            if (currentlyChefHatted) {
                await deleteDoc(chefHatRef)
                await updateDoc(postRef, { chefHats: increment(-1) })
                console.log('[usePosts] Chef hat removed')
            } else {
                await setDoc(chefHatRef, { userId: currentUser.uid, createdAt: serverTimestamp() })
                await updateDoc(postRef, { chefHats: increment(1) })
                console.log('[usePosts] Chef hat added')
            }
        } catch (err) {
            console.error('[usePosts] Error toggling chef hat:', err)
            throw err
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
            console.error('[usePosts] Error checking chef hat status:', err)
            return false
        }
    }, [currentUser])

    // Add a comment to a post
    const addComment = useCallback(async (postId: string, text: string, userName: string, userPhotoUrl?: string) => {
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
            console.log('[usePosts] Comment added')
        } catch (err) {
            console.error('[usePosts] Error adding comment:', err)
            throw err
        }
    }, [currentUser])

    // Delete a comment
    const deleteComment = useCallback(async (postId: string, commentId: string) => {
        if (!currentUser) throw new Error('Must be signed in to delete comments')

        const commentRef = doc(db, 'posts', postId, 'comments', commentId)
        const postRef = doc(db, 'posts', postId)

        try {
            await deleteDoc(commentRef)
            await updateDoc(postRef, { commentCount: increment(-1) })
            console.log('[usePosts] Comment deleted')
        } catch (err) {
            console.error('[usePosts] Error deleting comment:', err)
            throw err
        }
    }, [currentUser])

    // Get comments for a post
    const getComments = useCallback(async (postId: string): Promise<PostComment[]> => {
        const commentsQuery = query(
            collection(db, 'posts', postId, 'comments'),
            orderBy('createdAt', 'desc'),
            limit(50)
        )

        try {
            const snapshot = await getDocs(commentsQuery)
            return snapshot.docs.map(doc => {
                const data = doc.data()
                const createdAt = data.createdAt instanceof Timestamp
                    ? data.createdAt.toMillis()
                    : Date.now()
                return { id: doc.id, ...data, createdAt } as PostComment
            })
        } catch (err) {
            console.error('[usePosts] Error fetching comments:', err)
            return []
        }
    }, [])

    return {
        posts,
        loading,
        error,
        createPost,
        deletePost,
        toggleLike,
        checkIfLiked,
        toggleFire,
        checkIfFired,
        toggleChefHat,
        checkIfChefHatted,
        addComment,
        deleteComment,
        getComments
    }
}

// Hook to get posts for a specific user
export function useUserPosts(userId: string) {
    const [posts, setPosts] = useState<CookingPost[]>([])
    const [loading, setLoading] = useState(true)
    const { currentUser } = useAuth()

    useEffect(() => {
        if (!currentUser || !userId) {
            setPosts([])
            setLoading(false)
            return
        }

        const postsRef = collection(db, 'posts')
        const q = query(postsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postData: CookingPost[] = []
            snapshot.forEach((doc) => {
                const data = doc.data()
                const createdAt = data.createdAt instanceof Timestamp
                    ? data.createdAt.toMillis()
                    : Date.now()

                postData.push({
                    ...data,
                    id: doc.id,
                    createdAt
                } as CookingPost)
            })
            setPosts(postData)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [currentUser, userId])

    return { posts, loading }
}
