import { useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export interface TribeProfile {
    uid: string
    displayName: string
    photoUrls: string[]       // [0] = wild shot, [1] = cheffin shot
    rank: 'Scout' | 'Gatherer' | 'Hunter' | 'Elder'
    foodPreferences: string[]
    recipesCooked: number
    isDiscoverable: boolean
    createdAt: number
}

export function useTribeProfile() {
    const { currentUser } = useAuth()
    const [profile, setProfile] = useState<TribeProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!currentUser) { setProfile(null); setLoading(false); return }

        const ref_ = doc(db, 'tribeProfiles', currentUser.uid)
        const unsub = onSnapshot(ref_, (snap) => {
            if (snap.exists()) {
                setProfile({ uid: snap.id, ...snap.data() } as TribeProfile)
            } else {
                setProfile(null)
            }
            setLoading(false)
        }, () => setLoading(false))

        return unsub
    }, [currentUser])

    const uploadPhoto = useCallback(async (file: File, index: number): Promise<string> => {
        if (!currentUser) throw new Error('Not signed in')
        const storageRef = ref(storage, `tribeProfiles/${currentUser.uid}/photo-${index}`)
        await uploadBytes(storageRef, file)
        return getDownloadURL(storageRef)
    }, [currentUser])

    const saveProfile = useCallback(async (data: Omit<TribeProfile, 'uid'>) => {
        if (!currentUser) throw new Error('Not signed in')
        const profileRef = doc(db, 'tribeProfiles', currentUser.uid)
        await setDoc(profileRef, { ...data, uid: currentUser.uid }, { merge: true })
    }, [currentUser])

    return { profile, loading, uploadPhoto, saveProfile }
}
