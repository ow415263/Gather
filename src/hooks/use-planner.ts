import { useState, useEffect, useCallback } from 'react'
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    where,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Recipe } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'

export interface MealPlanItem {
    id: string
    date: number // ms timestamp
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'side-dish' | 'appetizer' | 'other'
    recipeId?: string
    customName?: string
    recipe?: Recipe // Populated from recipes list
}

export function usePlanner(recipes: Recipe[]) {
    const [mealPlanItems, setMealPlanItems] = useState<MealPlanItem[]>([])
    const [loading, setLoading] = useState(true)
    const { currentUser } = useAuth()

    useEffect(() => {
        if (!currentUser) {
            setMealPlanItems([])
            setLoading(false)
            return
        }

        const planRef = collection(db, 'users', currentUser.uid, 'meal-plan')
        // We could limit this to a date range if we want
        const q = query(planRef)

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items: MealPlanItem[] = []
            snapshot.forEach((doc) => {
                const data = doc.data()
                const recipeId = data.recipeId
                const recipe = recipeId ? recipes.find(r => r.id === recipeId) : undefined

                items.push({
                    ...data,
                    id: doc.id,
                    date: data.date instanceof Timestamp ? data.date.toMillis() : data.date,
                    recipe
                } as MealPlanItem)
            })
            setMealPlanItems(items)
            setLoading(false)
        }, (err) => {
            console.error('Error fetching meal plan:', err)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [currentUser, recipes])

    const addMeal = useCallback(async (date: Date, type: MealPlanItem['type'], recipeId: string) => {
        if (!currentUser) throw new Error('Must be signed in to add meals')

        const planRef = collection(db, 'users', currentUser.uid, 'meal-plan')
        await addDoc(planRef, {
            date: Timestamp.fromDate(date),
            type,
            recipeId,
            createdAt: serverTimestamp()
        })
    }, [currentUser])

    const deleteMeal = useCallback(async (mealId: string) => {
        if (!currentUser) throw new Error('Must be signed in to delete meals')

        const mealRef = doc(db, 'users', currentUser.uid, 'meal-plan', mealId)
        await deleteDoc(mealRef)
    }, [currentUser])

    return {
        mealPlanItems,
        loading,
        addMeal,
        deleteMeal
    }
}
