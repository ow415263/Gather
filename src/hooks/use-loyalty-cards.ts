import { useState, useEffect, useCallback } from 'react'
import {
    collection, addDoc, deleteDoc, doc,
    onSnapshot, updateDoc, query, orderBy
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { LoyaltyCard } from '@/lib/types'

export function useLoyaltyCards() {
    const { currentUser } = useAuth()
    const [cards, setCards] = useState<LoyaltyCard[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!currentUser) { setCards([]); setLoading(false); return }

        const q = query(
            collection(db, 'users', currentUser.uid, 'loyaltyCards'),
            orderBy('order', 'asc')
        )

        const unsub = onSnapshot(q, (snap) => {
            setCards(snap.docs.map(d => ({ id: d.id, ...d.data() } as LoyaltyCard)))
            setLoading(false)
        })

        return unsub
    }, [currentUser])

    const addCard = useCallback(async (storeName: string, imageDataUrl: string, displayColor?: string) => {
        if (!currentUser) return

        // Upload image to Firebase Storage
        const response = await fetch(imageDataUrl)
        const blob = await response.blob()
        const cardId = `card_${Date.now()}`
        const storageRef = ref(storage, `users/${currentUser.uid}/loyaltyCards/${cardId}.jpg`)
        await uploadBytes(storageRef, blob)
        const cardImageUrl = await getDownloadURL(storageRef)

        const newCard: Omit<LoyaltyCard, 'id'> = {
            userId: currentUser.uid,
            storeName,
            cardImageUrl,
            displayColor,
            order: cards.length,
            isPrimary: cards.length === 0, // First card is primary by default
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        await addDoc(collection(db, 'users', currentUser.uid, 'loyaltyCards'), newCard)
    }, [currentUser, cards.length])

    const deleteCard = useCallback(async (card: LoyaltyCard) => {
        if (!currentUser) return
        await deleteDoc(doc(db, 'users', currentUser.uid, 'loyaltyCards', card.id))
        // Best-effort cleanup from storage
        try {
            const storageRef = ref(storage, `users/${currentUser.uid}/loyaltyCards/${card.id}.jpg`)
            await deleteObject(storageRef)
        } catch (_) { /* ignore if not found */ }
    }, [currentUser])

    const setPrimary = useCallback(async (cardId: string) => {
        if (!currentUser) return
        const updates = cards.map(card =>
            updateDoc(doc(db, 'users', currentUser.uid, 'loyaltyCards', card.id), {
                isPrimary: card.id === cardId
            })
        )
        await Promise.all(updates)
    }, [currentUser, cards])

    return { cards, loading, addCard, deleteCard, setPrimary }
}
