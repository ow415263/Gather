import { useState, useCallback } from 'react'
import {
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    increment,
    serverTimestamp,
    onSnapshot,
    writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { UserProfile } from './use-user-profile'

export function useSocial() {
    const { currentUser } = useAuth()
    const [isFollowingMap, setIsFollowingMap] = useState<Record<string, boolean>>({})

    // Check if following a specific user (real-time)
    const checkIsFollowing = useCallback((targetUserId: string) => {
        if (!currentUser) return () => { }

        const followingRef = doc(db, 'users', currentUser.uid, 'following', targetUserId)
        return onSnapshot(followingRef, (doc) => {
            setIsFollowingMap(prev => ({
                ...prev,
                [targetUserId]: doc.exists()
            }))
        })
    }, [currentUser])

    const followUser = async (targetUserId: string) => {
        if (!currentUser) throw new Error('Must be signed in')

        const batch = writeBatch(db)

        // 1. Add to my 'following'
        const myFollowingRef = doc(db, 'users', currentUser.uid, 'following', targetUserId)
        batch.set(myFollowingRef, {
            followedAt: serverTimestamp()
        })

        // 2. Add to their 'followers'
        const theirFollowersRef = doc(db, 'users', targetUserId, 'followers', currentUser.uid)
        batch.set(theirFollowersRef, {
            followedAt: serverTimestamp(),
            followerId: currentUser.uid
        })

        // 3. Increment my following count
        const myProfileRef = doc(db, 'users', currentUser.uid)
        batch.update(myProfileRef, {
            'stats.followingCount': increment(1)
        })

        // 4. Increment their followers count & foodie score
        const theirProfileRef = doc(db, 'users', targetUserId)
        batch.update(theirProfileRef, {
            'stats.followersCount': increment(1)
        })

        await batch.commit()
    }

    const unfollowUser = async (targetUserId: string) => {
        if (!currentUser) throw new Error('Must be signed in')

        const batch = writeBatch(db)

        // 1. Remove from my 'following'
        const myFollowingRef = doc(db, 'users', currentUser.uid, 'following', targetUserId)
        batch.delete(myFollowingRef)

        // 2. Remove from their 'followers'
        const theirFollowersRef = doc(db, 'users', targetUserId, 'followers', currentUser.uid)
        batch.delete(theirFollowersRef)

        // 3. Decrement my following count
        const myProfileRef = doc(db, 'users', currentUser.uid)
        batch.update(myProfileRef, {
            'stats.followingCount': increment(-1)
        })

        // 4. Decrement their followers count
        const theirProfileRef = doc(db, 'users', targetUserId)
        batch.update(theirProfileRef, {
            'stats.followersCount': increment(-1)
        })

        await batch.commit()
    }

    const getPublicProfile = async (userId: string): Promise<UserProfile | null> => {
        const docRef = doc(db, 'users', userId)
        const snap = await getDoc(docRef)
        if (snap.exists()) {
            return snap.data() as UserProfile
        }
        return null
    }

    return {
        followUser,
        unfollowUser,
        checkIsFollowing,
        isFollowingMap,
        getPublicProfile
    }
}
