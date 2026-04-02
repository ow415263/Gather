import { useState, useEffect, useCallback } from 'react'
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Recipe } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'

export function useRecipes() {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const { currentUser } = useAuth()

    useEffect(() => {
        if (!currentUser) {
            setRecipes([])
            setLoading(false)
            return
        }

        const recipesRef = collection(db, 'users', currentUser.uid, 'recipes')
        const q = query(recipesRef, orderBy('createdAt', 'desc'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const recipeData: Recipe[] = []
            snapshot.forEach((doc) => {
                const data = doc.data()
                // Convert Firestore timestamp to number for backward compatibility
                const createdAt = data.createdAt instanceof Timestamp
                    ? data.createdAt.toMillis()
                    : Date.now()

                recipeData.push({
                    ...data,
                    id: doc.id,
                    createdAt
                } as Recipe)
            })
            setRecipes(recipeData)
            setLoading(false)
        }, (err) => {
            console.error('Error fetching recipes:', err)
            setError(err as Error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [currentUser])

    const addRecipe = useCallback(async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'userId'>) => {
        if (!currentUser) throw new Error('Must be signed in to add recipes')

        console.log('[useRecipes] Adding recipe to Firestore:', recipeData.name)
        const recipesRef = collection(db, 'users', currentUser.uid, 'recipes')
        try {
            // Filter out undefined values to prevent Firebase errors
            const cleanedData = Object.fromEntries(
                Object.entries(recipeData).filter(([_, value]) => value !== undefined)
            )

            const docRef = await addDoc(recipesRef, {
                ...cleanedData,
                userId: currentUser.uid,
                createdAt: serverTimestamp()
            })
            console.log('[useRecipes] Recipe added successfully with ID:', docRef.id)
            return docRef.id
        } catch (err) {
            console.error('[useRecipes] Error adding recipe:', err)
            throw err
        }
    }, [currentUser])

    const updateRecipe = useCallback(async (recipeId: string, recipeData: Partial<Omit<Recipe, 'id' | 'createdAt' | 'userId'>>) => {
        if (!currentUser) throw new Error('Must be signed in to update recipes')

        console.log('[useRecipes] Updating recipe in Firestore:', recipeId)
        const recipeRef = doc(db, 'users', currentUser.uid, 'recipes', recipeId)
        try {
            await updateDoc(recipeRef, recipeData)
            console.log('[useRecipes] Recipe updated successfully')
        } catch (err) {
            console.error('[useRecipes] Error updating recipe:', err)
            throw err
        }
    }, [currentUser])

    const deleteRecipe = useCallback(async (recipeId: string) => {
        if (!currentUser) throw new Error('Must be signed in to delete recipes')

        console.log('[useRecipes] Deleting recipe from Firestore:', recipeId)
        const recipeRef = doc(db, 'users', currentUser.uid, 'recipes', recipeId)
        try {
            await deleteDoc(recipeRef)
            console.log('[useRecipes] Recipe deleted successfully')
        } catch (err) {
            console.error('[useRecipes] Error deleting recipe:', err)
            throw err
        }
    }, [currentUser])

    return {
        recipes,
        loading,
        error,
        addRecipe,
        updateRecipe,
        deleteRecipe
    }
}
