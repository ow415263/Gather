import { useState } from 'react'
import {
    Trophy,
    CookingPot,
    Fire,
    Users,
    ShareNetwork,
    Medal,
    Scroll,
    ChefHat,
    ThumbsUp,
    Heart
} from '@phosphor-icons/react'
import { UserProgress, CircleActivity, Artifact, ForageRank } from '@/lib/types'
import { useUserProfile } from '@/hooks/use-user-profile'
import { useAuth } from '@/contexts/AuthContext'

// Rank thresholds for progress display
const RANK_THRESHOLDS: Record<ForageRank, { next: ForageRank | null; recipesNeeded: number }> = {
    Scout: { next: 'Gatherer', recipesNeeded: 5 },
    Gatherer: { next: 'Hunter', recipesNeeded: 20 },
    Hunter: { next: 'Elder', recipesNeeded: 50 },
    Elder: { next: null, recipesNeeded: 50 },
}

const RANK_ICONS: Record<ForageRank, string> = {
    Scout: '🌿', Gatherer: '🪨', Hunter: '🎯', Elder: '🔥'
}

// Mock Data for Prototype
const MOCK_PROGRESS: UserProgress = {
    userId: 'mock',
    rank: 'Scout',
    totalRecipesCooked: 3,
    totalTribePosts: 0,
    totalReviewsWritten: 0,
    totalConversationsStarted: 0,
    unlockedArtifacts: ['art-1'],
    updatedAt: Date.now(),
}

const MOCK_ARTIFACTS: Artifact[] = [
    {
        id: 'art-1',
        name: 'First Flame',
        description: 'Cooked your first meal',
        iconName: 'Fire',
        unlockCondition: 'Cook 1 recipe'
    },
    {
        id: 'art-2',
        name: 'Sous Chef',
        description: 'Reached Level 3',
        iconName: 'ChefHat',
        unlockCondition: 'Reach Level 3'
    },
    {
        id: 'art-3',
        name: 'Master of Spice',
        description: 'Cook 5 Indian recipes',
        iconName: 'CookingPot',
        unlockCondition: 'Cook 5 Indian recipes'
    },
]

const MOCK_ACTIVITY: CircleActivity[] = [
    {
        id: 'act-1',
        userId: 'u2',
        userName: 'Sarah',
        action: 'cooked',
        recipeName: 'Spicy Pad Thai',
        timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
        reactions: ['u1']
    },
    {
        id: 'act-2',
        userId: 'u3',
        userName: 'Mike',
        action: 'unlocked',
        artifactName: 'Grill Master',
        timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        reactions: []
    }
]

export function ProgressPage() {
    const { profile } = useUserProfile()
    const { currentUser } = useAuth()
    const [progress] = useState<UserProgress>(MOCK_PROGRESS)
    const [activities, setActivities] = useState<CircleActivity[]>(MOCK_ACTIVITY)

    const rankInfo = RANK_THRESHOLDS[progress.rank]
    const prevThreshold = progress.rank === 'Scout' ? 0 : RANK_THRESHOLDS['Scout'].recipesNeeded
    const rankProgress = progress.rank === 'Elder'
        ? 100
        : Math.min(100, (progress.totalRecipesCooked / rankInfo.recipesNeeded) * 100)

    const handleReaction = (activityId: string) => {
        // Mock reaction logic
        setActivities(prev => prev.map(act => {
            if (act.id === activityId) {
                const hasReacted = act.reactions.includes('currentUser')
                return {
                    ...act,
                    reactions: hasReacted
                        ? act.reactions.filter(id => id !== 'currentUser')
                        : [...act.reactions, 'currentUser']
                }
            }
            return act
        }))
    }

    const getArtifactIcon = (iconName: string) => {
        switch (iconName) {
            case 'Fire': return <Fire size={32} weight="fill" className="text-orange-500" />
            case 'ChefHat': return <ChefHat size={32} weight="fill" className="text-white" />
            case 'CookingPot': return <CookingPot size={32} weight="fill" className="text-amber-600" />
            default: return <Medal size={32} weight="fill" className="text-yellow-400" />
        }
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="pt-[calc(env(safe-area-inset-top)+24px)] px-6 pb-6 bg-card border-b border-border shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">Your Hunt</h1>
                        <p className="text-muted-foreground text-sm">
                            {RANK_ICONS[progress.rank]} {progress.rank} • {profile.familyCookName || 'Forager'}
                        </p>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-full">
                        <Trophy size={28} weight="duotone" className="text-primary" />
                    </div>
                </div>

                {/* Rank Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>{progress.rank}</span>
                        {rankInfo.next && <span>{rankInfo.next}</span>}
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                            style={{ width: `${rankProgress}%` }}
                        />
                    </div>
                    {rankInfo.next ? (
                        <p className="text-xs text-center text-muted-foreground mt-2">
                            {rankInfo.recipesNeeded - progress.totalRecipesCooked} more recipes to {rankInfo.next}
                        </p>
                    ) : (
                        <p className="text-xs text-center text-muted-foreground mt-2">You've reached Elder status 🔥</p>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center gap-2">
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full text-orange-600">
                            <CookingPot size={24} weight="bold" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold block">{progress.totalRecipesCooked}</span>
                            <span className="text-xs text-muted-foreground">Dishes Cooked</span>
                        </div>
                    </div>
                    <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center gap-2">
                        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-full text-red-600">
                            <Fire size={24} weight="bold" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold block">12</span>
                            <span className="text-xs text-muted-foreground">Day Streak</span>
                        </div>
                    </div>
                </div>

                {/* Inner Circle / Chef's Table */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Users size={20} className="text-primary" />
                            Inner Circle
                        </h2>
                        <button className="text-xs bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1">
                            <ShareNetwork size={14} />
                            Invite
                        </button>
                    </div>

                    <div className="bg-muted/30 rounded-2xl p-4 space-y-4">
                        {activities.map(activity => (
                            <div key={activity.id} className="flex gap-3 items-start">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                    {/* Placeholder Avatar */}
                                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                        {activity.userName[0]}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm">
                                        <span className="font-semibold">{activity.userName}</span>
                                        <span className="text-muted-foreground">
                                            {activity.action === 'cooked' ? ' just cooked ' : ' unlocked '}
                                        </span>
                                        <span className={activity.action === 'cooked' ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-yellow-600 dark:text-yellow-400 font-medium'}>
                                            {activity.action === 'cooked' ? activity.recipeName : activity.artifactName}
                                        </span>
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        {Math.floor((Date.now() - activity.timestamp) / 60000)}m ago
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleReaction(activity.id)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${activity.reactions.includes('currentUser')
                                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                                        : 'bg-background hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground'
                                        }`}
                                >
                                    {activity.action === 'cooked' ? <ThumbsUp size={14} weight={activity.reactions.includes('currentUser') ? "fill" : "regular"} /> : <Heart size={14} weight={activity.reactions.includes('currentUser') ? "fill" : "regular"} />}
                                    {activity.reactions.length > 0 && <span>{activity.reactions.length}</span>}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Artifacts Collection */}
                <section>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Scroll size={20} className="text-amber-600" />
                        Artifacts
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        {MOCK_ARTIFACTS.map(artifact => {
                            const isUnlocked = progress.unlockedArtifacts.includes(artifact.id)
                            return (
                                <div
                                    key={artifact.id}
                                    className={`aspect-[4/5] rounded-xl p-3 flex flex-col items-center justify-center text-center gap-2 transition-all relative overflow-hidden ${isUnlocked
                                        ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-700/30'
                                        : 'bg-muted/50 grayscale opacity-60 border border-transparent'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${isUnlocked ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-muted-foreground/20'
                                        }`}>
                                        {getArtifactIcon(artifact.iconName)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold leading-tight mb-1">{artifact.name}</p>
                                        <p className="text-[10px] text-muted-foreground leading-tight hidden lg:block">{artifact.description}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>
        </div>
    )
}
