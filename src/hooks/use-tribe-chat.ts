import { useState, useEffect, useCallback } from 'react'
import {
    collection, addDoc, onSnapshot, query,
    orderBy, serverTimestamp, doc, setDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export interface TribeMessage {
    id: string
    senderId: string
    text: string
    createdAt: number
}

export interface TribeConversation {
    id: string
    participantIds: string[]
    createdAt: number
}

// Deterministic conversation ID so two people always share the same doc
function conversationId(uid1: string, uid2: string) {
    return [uid1, uid2].sort().join('__')
}

export function useTribeChat(otherUserId: string | null) {
    const { currentUser } = useAuth()
    const [messages, setMessages] = useState<TribeMessage[]>([])
    const [loading, setLoading] = useState(false)
    const convId = currentUser && otherUserId
        ? conversationId(currentUser.uid, otherUserId)
        : null

    // Ensure conversation doc exists, then subscribe to messages
    useEffect(() => {
        if (!convId || !currentUser || !otherUserId) return
        setLoading(true)

        const convRef = doc(db, 'tribeConversations', convId)
        setDoc(convRef, {
            participantIds: [currentUser.uid, otherUserId],
            createdAt: Date.now(),
        }, { merge: true })

        const msgsRef = collection(db, 'tribeConversations', convId, 'messages')
        const q = query(msgsRef, orderBy('createdAt', 'asc'))

        const unsub = onSnapshot(q, (snap) => {
            setMessages(snap.docs.map(d => ({
                id: d.id,
                senderId: d.data().senderId,
                text: d.data().text,
                createdAt: d.data().createdAt?.toMillis?.() ?? Date.now(),
            })))
            setLoading(false)
        }, () => setLoading(false))

        return unsub
    }, [convId, currentUser, otherUserId])

    const sendMessage = useCallback(async (text: string) => {
        if (!convId || !currentUser || !text.trim()) return
        const msgsRef = collection(db, 'tribeConversations', convId, 'messages')
        await addDoc(msgsRef, {
            senderId: currentUser.uid,
            text: text.trim(),
            createdAt: serverTimestamp(),
        })
    }, [convId, currentUser])

    return { messages, loading, sendMessage }
}
