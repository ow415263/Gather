import { useState, useEffect } from 'react'
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    orderBy,
    serverTimestamp,
    doc,
    updateDoc,
    increment,
    runTransaction
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Review, Recipe } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from './use-user-profile'

export function useReviews(recipeId: string, recipeOwnerId: string) {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const { currentUser } = useAuth()
    const { profile } = useUserProfile()

    useEffect(() => {
        if (!recipeId || !recipeOwnerId) {
            setLoading(false)
            return
        }

        const reviewsRef = collection(db, 'users', recipeOwnerId, 'recipes', recipeId, 'reviews')
        const q = query(reviewsRef, orderBy('createdAt', 'desc'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviewsData: Review[] = []
            snapshot.forEach((doc) => {
                const data = doc.data()
                reviewsData.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toMillis?.() || Date.now()
                } as Review)
            })
            setReviews(reviewsData)
            setLoading(false)
        }, (err) => {
            console.error('Error fetching reviews:', err)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [recipeId, recipeOwnerId])

    const addReview = async (rating: number, text: string, isPublic: boolean) => {
        if (!currentUser || !profile) throw new Error('Must be signed in to add reviews')

        const reviewsRef = collection(db, 'users', recipeOwnerId, 'recipes', recipeId, 'reviews')
        const recipeRef = doc(db, 'users', recipeOwnerId, 'recipes', recipeId)

        try {
            await runTransaction(db, async (transaction) => {
                // 1. Create Review
                const newReviewRef = doc(reviewsRef)
                transaction.set(newReviewRef, {
                    recipeId,
                    userId: currentUser.uid,
                    userName: profile.familyCookName || currentUser.email?.split('@')[0] || 'Anonymous',
                    // Use photoURL from profile or auth, consistent with UserProfile interface
                    userPhotoUrl: profile.photoURL || currentUser.photoURL || null,
                    rating,
                    text: text.trim(),
                    isPublic,
                    helpfulCount: 0,
                    createdAt: serverTimestamp()
                })

                // 2. Update Recipe Stats
                // We need to read the recipe first to calculate new average
                const recipeDoc = await transaction.get(recipeRef)
                if (!recipeDoc.exists()) throw new Error('Recipe not found')

                const recipeData = recipeDoc.data()
                const currentRating = recipeData.rating || 0
                const currentCount = recipeData.reviewCount || 0

                const newCount = currentCount + 1
                const newRating = ((currentRating * currentCount) + rating) / newCount

                transaction.update(recipeRef, {
                    rating: Number(newRating.toFixed(1)),
                    reviewCount: newCount
                })
            })

            console.log('[useReviews] Review added successfully')
        } catch (err) {
            console.error('[useReviews] Error adding review:', err)
            throw err
        }
    }

    return {
        reviews,
        loading,
        addReview
    }
}
