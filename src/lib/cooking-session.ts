
import { Recipe } from './types'

export interface CookingSession {
    recipeId: string
    ownerId: string
    recipeName: string
    recipeImage?: string
    finishedAt: number
    reviewed: boolean
    dismissed: boolean
    // Tracks if we've already shown the prompt for this session
    promptShown: boolean
}

const STORAGE_KEY = 'fudi_cooking_sessions'

function getSessions(): CookingSession[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch (e) {
        console.error('Failed to parse cooking sessions', e)
        return []
    }
}

function saveSessions(sessions: CookingSession[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } catch (e) {
        console.error('Failed to save cooking sessions', e)
    }
}

export const cookingSessionManager = {
    startSession: (recipe: Recipe) => {
        // We only care about finished sessions for the review prompt, 
        // but we could track start time if needed. 
        // For now, this is just a placeholder if we want to expand.
    },

    completeSession: (recipe: Recipe) => {
        const sessions = getSessions()

        // Check if there's already a recent session for this recipe (debounce)
        // e.g., if they clicked finish multiple times
        const recentSession = sessions.find(s =>
            s.recipeId === recipe.id &&
            Date.now() - s.finishedAt < 1000 * 60 * 5 // 5 minutes
        )

        if (recentSession) return

        const newSession: CookingSession = {
            recipeId: recipe.id,
            ownerId: recipe.userId,
            recipeName: recipe.name,
            recipeImage: recipe.imageUrl,
            finishedAt: Date.now(),
            reviewed: false,
            dismissed: false,
            promptShown: false
        }

        // Keep only last 20 sessions to avoid bloat
        const updatedSessions = [newSession, ...sessions].slice(0, 20)
        saveSessions(updatedSessions)
    },

    getPendingReview: (): CookingSession | null => {
        const sessions = getSessions()
        const now = Date.now()
        // 1 hour in ms
        const DELAY_MS = 1000 * 60 * 60

        // Find a session that:
        // 1. Is older than delay
        // 2. Has NOT been reviewed
        // 3. Has NOT been dismissed
        // 4. Has NOT been prompted yet
        const pending = sessions.find(s =>
            !s.reviewed &&
            !s.dismissed &&
            !s.promptShown &&
            (now - s.finishedAt > DELAY_MS)
        )

        return pending || null
    },

    markAsPrompShown: (recipeId: string) => {
        const sessions = getSessions()
        const updated = sessions.map(s =>
            s.recipeId === recipeId ? { ...s, promptShown: true } : s
        )
        saveSessions(updated)
    },

    markAsReviewed: (recipeId: string) => {
        const sessions = getSessions()
        const updated = sessions.map(s =>
            s.recipeId === recipeId ? { ...s, reviewed: true } : s
        )
        saveSessions(updated)
    },

    dismissReview: (recipeId: string) => {
        const sessions = getSessions()
        const updated = sessions.map(s =>
            s.recipeId === recipeId ? { ...s, dismissed: true } : s
        )
        saveSessions(updated)
    }
}
