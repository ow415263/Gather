import { useState, useEffect, useCallback } from 'react'
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ShoppingListItem } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'

export function useShoppingList() {
    const [items, setItems] = useState<ShoppingListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const { currentUser } = useAuth()

    useEffect(() => {
        if (!currentUser) {
            setItems([])
            setLoading(false)
            return
        }

        const itemsRef = collection(db, 'users', currentUser.uid, 'shopping-list')
        const q = query(itemsRef, orderBy('createdAt', 'desc'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const itemData: ShoppingListItem[] = []
            snapshot.forEach((doc) => {
                itemData.push({ ...doc.data(), id: doc.id } as ShoppingListItem)
            })
            setItems(itemData)
            setLoading(false)
        }, (err) => {
            console.error('Error fetching shopping list:', err)
            setError(err as Error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [currentUser])

    const addItem = useCallback(async (name: string) => {
        if (!currentUser) throw new Error('Must be signed in to add items')

        const itemsRef = collection(db, 'users', currentUser.uid, 'shopping-list')
        await addDoc(itemsRef, {
            name,
            checked: false,
            createdAt: serverTimestamp()
        })
    }, [currentUser])

    const addItems = useCallback(async (names: string[]) => {
        if (!currentUser) throw new Error('Must be signed in to add items')

        const itemsRef = collection(db, 'users', currentUser.uid, 'shopping-list')
        const batch = writeBatch(db)

        names.forEach(name => {
            const newDocRef = doc(itemsRef)
            batch.set(newDocRef, {
                name,
                checked: false,
                createdAt: serverTimestamp()
            })
        })

        await batch.commit()
    }, [currentUser])

    const toggleItem = useCallback(async (itemId: string, checked: boolean) => {
        if (!currentUser) throw new Error('Must be signed in to update items')

        const itemRef = doc(db, 'users', currentUser.uid, 'shopping-list', itemId)
        await updateDoc(itemRef, { checked })
    }, [currentUser])

    const deleteItem = useCallback(async (itemId: string) => {
        if (!currentUser) throw new Error('Must be signed in to delete items')

        const itemRef = doc(db, 'users', currentUser.uid, 'shopping-list', itemId)
        await deleteDoc(itemRef)
    }, [currentUser])

    const clearChecked = useCallback(async () => {
        if (!currentUser) throw new Error('Must be signed in to clear items')

        const batch = writeBatch(db)
        items.filter(item => item.checked).forEach(item => {
            const itemRef = doc(db, 'users', currentUser.uid, 'shopping-list', item.id)
            batch.delete(itemRef)
        })

        await batch.commit()
    }, [currentUser, items])

    const clearAll = useCallback(async () => {
        if (!currentUser) throw new Error('Must be signed in to clear list')

        const batch = writeBatch(db)
        items.forEach(item => {
            const itemRef = doc(db, 'users', currentUser.uid, 'shopping-list', item.id)
            batch.delete(itemRef)
        })

        await batch.commit()
    }, [currentUser, items])

    return {
        items,
        loading,
        error,
        addItem,
        addItems,
        toggleItem,
        deleteItem,
        clearChecked,
        clearAll
    }
}
