import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export interface UserProfile {
    familyCookName?: string
    foodPreferences?: string[]
    onboardingCompleted?: boolean
    photoURL?: string // Cache photoURL here if needed, or rely on Auth
    bio?: string
    filters?: string[] // For "My Posts" filter
    stats?: {
        recipesCount: number
        postsCount: number
        followersCount: number
        followingCount: number
        foodieScore: number
        streakDays: number
    }
    badges?: string[]
}

export function useUserProfile() {
    const [profile, setProfile] = useState<UserProfile>({
        familyCookName: '',
        foodPreferences: [],
        onboardingCompleted: false,
        stats: {
            recipesCount: 0,
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
            foodieScore: 0,
            streakDays: 0
        },
        badges: []
    })
    const [loading, setLoading] = useState(true)
    const { currentUser } = useAuth()

    useEffect(() => {
        if (!currentUser) {
            setLoading(false)
            return
        }

        const profileRef = doc(db, 'users', currentUser.uid)

        const unsubscribe = onSnapshot(profileRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data()
                setProfile({
                    familyCookName: data.familyCookName || '',
                    foodPreferences: data.foodPreferences || [],
                    // If onboardingCompleted is missing, assume true if we have a name (legacy user), otherwise false
                    onboardingCompleted: data.onboardingCompleted ?? (!!data.familyCookName),
                    photoURL: data.photoURL,
                    bio: data.bio || '',
                    stats: data.stats || {
                        recipesCount: 0,
                        postsCount: 0,
                        followersCount: 0,
                        followingCount: 0,
                        foodieScore: 0,
                        streakDays: 0
                    },
                    badges: data.badges || []
                })
            } else {
                // Initialize profile if it doesn't exist
                setProfile({
                    familyCookName: '',
                    foodPreferences: [],
                    onboardingCompleted: false
                })
            }
            setLoading(false)
        }, (err) => {
            console.error('Error fetching profile:', err)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [currentUser])

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!currentUser) throw new Error('Must be signed in to update profile')

        // Remove undefined values to prevent Firestore errors
        const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
        )

        const profileRef = doc(db, 'users', currentUser.uid)
        await setDoc(profileRef, cleanUpdates, { merge: true })
    }

    return {
        profile,
        loading,
        updateProfile
    }
}
