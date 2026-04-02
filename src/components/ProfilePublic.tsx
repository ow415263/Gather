import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocial } from '@/hooks/use-social'
import { UserProfile } from '@/hooks/use-user-profile'
import { useAuth } from '@/contexts/AuthContext'
import { PostReactionProvider } from '@/contexts/PostReactionContext'
import { PostCommentsProvider } from '@/contexts/PostCommentsContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Fire, ChefHat, UserPlus, UserMinus, ArrowLeft } from '@phosphor-icons/react'
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CookingPost, Recipe } from '@/lib/types'
import { FeedPost } from './FeedPost'
import { RecipeCard } from './RecipeCard'

export function ProfilePublic() {
    const { userId } = useParams()
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const { getPublicProfile, followUser, unfollowUser, checkIsFollowing, isFollowingMap } = useSocial()

    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [posts, setPosts] = useState<CookingPost[]>([])
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(true)

    const isOwnProfile = currentUser?.uid === userId
    const isFollowing = userId ? isFollowingMap[userId] : false

    useEffect(() => {
        if (!userId) return

        // 1. Check follow status
        const unsubscribe = checkIsFollowing(userId)

        // 2. Load Profile
        getPublicProfile(userId).then(setProfile)

        // 3. Load Posts
        const loadContent = async () => {
            // Posts
            const postsQ = query(
                collection(db, 'posts'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            )
            const postsSnap = await getDocs(postsQ)
            setPosts(postsSnap.docs.map(d => {
                const data = d.data()
                const createdAt = data.createdAt instanceof Timestamp
                    ? data.createdAt.toMillis()
                    : Date.now()
                return { id: d.id, ...data, createdAt } as CookingPost
            }))

            // Recipes (Assumption: All recipes are public for now for Community 2.0)
            const recipesQ = query(
                collection(db, 'users', userId, 'recipes'),
                orderBy('createdAt', 'desc')
            )
            const recipesSnap = await getDocs(recipesQ)
            setRecipes(recipesSnap.docs.map(d => {
                const data = d.data()
                const createdAt = data.createdAt instanceof Timestamp
                    ? data.createdAt.toMillis()
                    : Date.now()
                return { id: d.id, ...data, createdAt } as Recipe
            }))

            setLoading(false)
        }
        loadContent()

        return () => unsubscribe()
    }, [userId, checkIsFollowing])

    const handleFollowToggle = async () => {
        if (!userId) return
        if (isFollowing) {
            await unfollowUser(userId)
        } else {
            await followUser(userId)
        }
        // Refresh profile to update counts
        getPublicProfile(userId).then(setProfile)
    }

    // Placeholder handlers for FeedPost interactions
    const handleLikeToggle = async () => { }
    const handleFireToggle = async () => { }
    const handleChefHatToggle = async () => { }
    const handleDeletePost = async () => { }
    const handleRecipeClick = () => { }
    const handleAddComment = async () => { }
    const handleDeleteComment = async () => { }
    const handleLoadComments = () => { }

    if (loading) return <div className="p-8 text-center">Loading Chef Profile...</div>
    if (!profile) return <div className="p-8 text-center">User not found.</div>

    const postIds = posts.map(p => p.id)

    return (
        <PostReactionProvider postIds={postIds}>
            <PostCommentsProvider>
                <div className="min-h-screen bg-background pb-20">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border pt-[calc(env(safe-area-inset-top)+16px)] pb-4 px-4 flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                            <ArrowLeft size={24} />
                        </Button>
                        <h1 className="text-xl font-bold truncate">
                            {profile.familyCookName || 'Chef'}
                        </h1>
                    </div>

                    <div className="p-6 space-y-8 max-w-2xl mx-auto">
                        {/* Profile Stats Card */}
                        <div className="flex flex-col items-center gap-4">
                            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                                <AvatarImage src={profile.photoURL} />
                                <AvatarFallback className="text-4xl bg-muted">
                                    {profile.familyCookName?.[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-bold">{profile.familyCookName}</h2>
                                {profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}

                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 text-sm font-medium">
                                        <Fire weight="fill" />
                                        {profile.stats?.foodieScore || 0} Foodie Score
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 text-center w-full max-w-sm">
                                <div>
                                    <div className="text-2xl font-bold">{profile.stats?.recipesCount || 0}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Recipes</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {(profile.stats?.followersCount || 0) + (profile.stats?.followingCount || 0)}
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Foodie Friends</div>
                                </div>
                            </div>

                            {!isOwnProfile && (
                                <Button
                                    className={isFollowing ? "w-full sm:w-auto" : "w-full sm:w-auto bg-primary"}
                                    variant={isFollowing ? "outline" : "default"}
                                    onClick={handleFollowToggle}
                                >
                                    {isFollowing ? (
                                        <>
                                            <UserMinus className="mr-2" size={18} />
                                            Unfollow
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="mr-2" size={18} />
                                            Follow Chef
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        {/* Content Tabs */}
                        <Tabs defaultValue="cooks" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl">
                                <TabsTrigger value="cooks" className="text-base">Cooks</TabsTrigger>
                                <TabsTrigger value="recipes" className="text-base">Recipes</TabsTrigger>
                            </TabsList>

                            <TabsContent value="cooks" className="mt-6 space-y-6">
                                {posts.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No cooks posted yet.
                                    </div>
                                ) : (
                                    posts.map(post => (
                                        <FeedPost
                                            key={post.id}
                                            post={post}
                                            onDelete={handleDeletePost}
                                            onRecipeClick={handleRecipeClick}
                                        />
                                    ))
                                )}
                            </TabsContent>

                            <TabsContent value="recipes" className="mt-6">
                                {recipes.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No recipes shared yet.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {recipes.map(recipe => (
                                            <RecipeCard key={recipe.id} recipe={recipe} onClick={() => { }} />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </PostCommentsProvider>
        </PostReactionProvider>
    )
}
