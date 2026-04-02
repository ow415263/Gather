import { Drawer } from 'vaul'
import { useState, useRef, useMemo } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import {
    X, Heart, MapPin, Fire, ArrowLeft, UsersThree, HandPalm, Fingerprint, FolderStar,
    ChefHat, ChatCircle
} from '@phosphor-icons/react'
import { usePosts } from '@/hooks/use-posts'
import { useRecipes } from '@/hooks/use-recipes'
import { useTribeProfile } from '@/hooks/use-tribe-profile'
import { useAuth } from '@/contexts/AuthContext'
import { TribeOnboarding } from '@/pages/TribeOnboarding'
import { TribeChat } from '@/components/TribeChat'
import { formatDistanceToNow } from 'date-fns'
import { ConnectionsGraph } from '@/components/ConnectionsGraph'

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface CookProfile {
    id: string
    name: string
    rank: 'Scout' | 'Gatherer' | 'Hunter' | 'Elder'
    distance: string
    photoUrls: string[]     // [0] = profile selfie, [1+] = more selfies
    recipePreviews: string[] // thumbnails of their cooked dishes
    caption: string
    foodPreferences: string[]
    recipesCooked: number
}

const RANK_ICONS: Record<CookProfile['rank'], string> = {
    Scout: '🌿', Gatherer: '🪨', Hunter: '🎯', Elder: '🔥'
}

const MOCK_PROFILES: CookProfile[] = [
    {
        id: '1',
        name: 'Maya',
        rank: 'Hunter',
        distance: '0.4 km',
        photoUrls: [
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80',
        ],
        recipePreviews: [
            'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&q=70',
            'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=300&q=70',
            'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&q=70',
        ],
        caption: 'Sourdough obsessed. Rosemary everything 🍞',
        foodPreferences: ['Baking', 'Mediterranean', 'Italian'],
        recipesCooked: 34,
    },
    {
        id: '2',
        name: 'Theo',
        rank: 'Elder',
        distance: '1.2 km',
        photoUrls: [
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
        ],
        recipePreviews: [
            'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&q=70',
            'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&q=70',
            'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&q=70',
        ],
        caption: 'Slow cook everything. 6hr lamb shoulder is my love language 🐑',
        foodPreferences: ['BBQ', 'Middle Eastern', 'Comfort Food'],
        recipesCooked: 87,
    },
    {
        id: '3',
        name: 'Priya',
        rank: 'Gatherer',
        distance: '2.1 km',
        photoUrls: [
            'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80',
        ],
        recipePreviews: [
            'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300&q=70',
            'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&q=70',
        ],
        caption: "Dal makhani from gran's recipe. Never writing it down 🙏",
        foodPreferences: ['Indian', 'Vegetarian', 'Healthy'],
        recipesCooked: 18,
    },
    {
        id: '4',
        name: 'Carlos',
        rank: 'Scout',
        distance: '0.8 km',
        photoUrls: [
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80',
        ],
        recipePreviews: [
            'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&q=70',
        ],
        caption: 'First time making tacos al pastor — came out perfect 🌮',
        foodPreferences: ['Mexican', 'BBQ', 'Quick & Easy'],
        recipesCooked: 6,
    },
    {
        id: '5',
        name: 'Nadia',
        rank: 'Hunter',
        distance: '3.4 km',
        photoUrls: [
            'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80',
        ],
        recipePreviews: [
            'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=300&q=70',
            'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&q=70',
            'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=300&q=70',
        ],
        caption: 'Korean fried chicken & mochi ice cream addict 🍗',
        foodPreferences: ['Korean', 'Japanese', 'Baking'],
        recipesCooked: 42,
    },
]

// ─── Food Discovery Grid & Chef Profile Sheet ──────────────────────────────────
export interface FeedItem {
    id: string;
    photoUrl: string;
    chef: CookProfile;
    heightVariant: number;
}

function FoodDiscoveryGrid({
    profiles,
    onPhotoTap
}: {
    profiles: CookProfile[]
    onPhotoTap: (item: FeedItem) => void
}) {
    const feedItems: FeedItem[] = useMemo(() => {
        const items: FeedItem[] = []
        profiles.forEach(p => {
            p.recipePreviews.forEach((url, i) => {
                items.push({
                    id: `${p.id}-${i}`,
                    photoUrl: url,
                    chef: p,
                    heightVariant: (items.length % 3) === 0 ? 0 : (items.length % 2) === 0 ? 1 : 2
                })
            })
        })
        return items.sort((a, b) => a.id.localeCompare(b.id)) // basic interleave
    }, [profiles])

    const col1 = feedItems.filter((_, i) => i % 2 === 0)
    const col2 = feedItems.filter((_, i) => i % 2 === 1)

    return (
        <div className="grid grid-cols-2 gap-3 w-full pb-8">
            <div className="flex flex-col gap-3">
                {col1.map(item => (
                    <motion.div
                        key={item.id}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full bg-muted rounded-2xl overflow-hidden shadow-sm relative cursor-pointer ${item.heightVariant === 0 ? 'aspect-[3/4]' : item.heightVariant === 1 ? 'aspect-square' : 'aspect-[4/5]'}`}
                        onClick={() => onPhotoTap(item)}
                    >
                        <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                    </motion.div>
                ))}
            </div>
            <div className="flex flex-col gap-3">
                {col2.map(item => (
                    <motion.div
                        key={item.id}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full bg-muted rounded-2xl overflow-hidden shadow-sm relative cursor-pointer ${item.heightVariant === 0 ? 'aspect-square' : item.heightVariant === 1 ? 'aspect-[4/5]' : 'aspect-[3/4]'}`}
                        onClick={() => onPhotoTap(item)}
                    >
                        <img src={item.photoUrl} alt="" className="w-full h-full object-cover" />
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

function ChefProfileSheet({
    item,
    onClose,
    onConnect,
    isConnected
}: {
    item: FeedItem
    onClose: () => void
    onConnect: () => void
    isConnected: boolean
}) {
    const { addRecipe } = useRecipes()
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const chef = item.chef

    const [holdProgress, setHoldProgress] = useState(0)
    const holdIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isConnected) return
        e.preventDefault()
        if (navigator.vibrate) navigator.vibrate(50)
        
        let progress = 0
        holdIntervalRef.current = setInterval(() => {
            progress += 4
            if (progress >= 100) {
                progress = 100
                clearInterval(holdIntervalRef.current!)
                if (navigator.vibrate) navigator.vibrate([100, 50, 100])
                onConnect()
            }
            setHoldProgress(progress)
        }, 30)
    }

    const handlePointerUp = () => {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current)
        if (!isConnected) setHoldProgress(0)
    }

    return (
        <Drawer.Root
            open={!!item}
            onOpenChange={(open) => {
                if (!open) onClose()
            }}
            snapPoints={[0.85, 1]}
            activeSnapPoint={0.85}
            setActiveSnapPoint={() => {}}
        >
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                <Drawer.Content className="bg-background flex flex-col rounded-t-[32px] mt-24 max-h-[100dvh] fixed bottom-0 left-0 right-0 z-50 outline-none">
                    
                    <div className="flex-1 overflow-y-auto w-full rounded-t-[32px] scrollbar-hide">
                        {/* Drawer Handle */}
                        <div className="sticky top-0 w-full flex justify-center pt-3 pb-3 z-20 bg-gradient-to-b from-black/20 to-transparent">
                            <div className="w-12 h-1.5 rounded-full bg-white/60 backdrop-blur-md" />
                        </div>

                        {/* Top Dish Photo */}
                        <div className="w-full aspect-[4/3] bg-muted relative -mt-8">
                            <img src={item.photoUrl} alt="Dish" className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
                            
                            {/* Close Button */}
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation()
                                    if (saved || isSaving) return
                                    setIsSaving(true)
                                    try {
                                        await addRecipe({
                                            name: chef.name + "'s Recipe",
                                            description: chef.caption,
                                            category: 'Dinner',
                                            prepTime: 15,
                                            cookTime: 30,
                                            servings: 2,
                                            ingredients: [],
                                            instructions: [],
                                            imageUrl: item.photoUrl,
                                            isSaved: true
                                        })
                                        setSaved(true)
                                    } finally {
                                        setIsSaving(false)
                                    }
                                }}
                                className="absolute top-12 left-4 px-4 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white gap-2 font-semibold text-sm transition-all shadow-sm active:scale-95"
                            >
                                <FolderStar size={20} weight={saved ? "fill" : "regular"} className={saved ? "text-yellow-400" : ""} />
                                {saved ? "Vaulted" : "Grab Recipe"}
                            </button>
                            <button
                                onClick={onClose}
                                className="absolute top-12 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white"
                            >
                                <X size={20} weight="bold" />
                            </button>

                            {/* Stamp Overlay if connected */}
                            <AnimatePresence>
                                {isConnected && (
                                    <motion.div 
                                        initial={{ scale: 3, opacity: 0, rotate: -20 }}
                                        animate={{ scale: 1, opacity: 1, rotate: 10 }}
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    >
                                        <div className="bg-primary/20 backdrop-blur-sm p-8 rounded-full border-4 border-primary shadow-2xl shadow-primary/40 transform -translate-y-4">
                                            <HandPalm size={80} weight="fill" className="text-primary" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Chef Info */}
                        <div className="px-5 -mt-8 relative space-y-5">
                            <div className="flex items-end gap-3">
                                <img
                                    src={chef.photoUrls[0]}
                                    alt={chef.name}
                                    className="w-20 h-20 rounded-2xl object-cover border-4 border-background shadow-sm bg-muted"
                                />
                                <div className="pb-1">
                                    <h2 className="text-2xl font-bold leading-none">{chef.name}</h2>
                                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                                        <span>{RANK_ICONS[chef.rank]}</span>
                                        <span>{chef.rank}</span>
                                        <span>·</span>
                                        <MapPin size={14} />
                                        <span>{chef.distance}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-base text-foreground bg-muted/40 p-4 rounded-2xl italic">
                                    "{chef.caption}"
                                </p>
                                
                                <div className="flex flex-wrap gap-2">
                                    {chef.foodPreferences.map(p => (
                                        <span key={p} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* "Leave Imprint" Interaction */}
                            <div className="pt-2 pb-6">
                                <div className="relative w-full h-20 rounded-3xl bg-muted overflow-hidden">
                                    {/* Progress Fill */}
                                    <div 
                                        className="absolute top-0 left-0 bottom-0 bg-primary/20 transition-all duration-75 ease-linear pointer-events-none"
                                        style={{ width: `${holdProgress}%` }}
                                    />
                                    
                                    {/* Imprint Button */}
                                    <button
                                        onPointerDown={handlePointerDown}
                                        onPointerUp={handlePointerUp}
                                        onPointerLeave={handlePointerUp}
                                        className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center transition-transform active:scale-[0.98] ${isConnected ? 'cursor-default' : 'cursor-pointer'}`}
                                    >
                                        {isConnected ? (
                                            <>
                                                <HandPalm size={28} weight="fill" className="text-primary mb-1" />
                                                <span className="text-xs font-bold text-primary">Imprinted</span>
                                            </>
                                        ) : (
                                            <>
                                                <Fingerprint size={28} weight={holdProgress > 0 ? 'fill' : 'regular'} className={holdProgress > 0 ? 'text-primary' : 'text-muted-foreground'} />
                                                <span className="text-xs font-bold text-muted-foreground mt-1">Press and hold to Imprint</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Other Dishes Grid */}
                            <div className="pb-[calc(env(safe-area-inset-bottom)+40px)]">
                                <h3 className="text-lg font-bold font-['Office_Times_Round'] mb-3">Chef's Gallery</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {chef.recipePreviews.filter(url => url !== item.photoUrl).map((url, i) => (
                                        <div key={i} className="w-full bg-muted rounded-xl overflow-hidden shadow-sm aspect-square">
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    )
}

// ─── Global Feed Post Card ─────────────────────────────────────────────────────
function GlobalPostCard({ post }: { post: any }) {
    const timeAgo = post.createdAt
        ? formatDistanceToNow(post.createdAt, { addSuffix: true })
        : 'recently'

    return (
        <div className="w-full bg-card rounded-2xl overflow-hidden border border-border/40">
            {post.imageUrl && (
                <img src={post.imageUrl} alt={post.recipeName || ''} className="w-full aspect-[4/3] object-cover" />
            )}
            <div className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {(post.userName?.[0] || 'F').toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold">{post.userName || 'Forager'}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{timeAgo}</span>
                </div>
                {post.recipeName && (
                    <p className="text-sm font-medium">{post.recipeName}</p>
                )}
                {post.caption && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.caption}</p>
                )}
                <div className="flex items-center gap-4 pt-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Fire size={16} className="text-orange-400" />
                        <span>{post.fires || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Heart size={16} className="text-red-400" />
                        <span>{post.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ChefHat size={16} className="text-yellow-400" />
                        <span>{post.chefHats || 0}</span>
                    </div>
                    {(post.commentCount || 0) > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                            <ChatCircle size={16} />
                            <span>{post.commentCount}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Per-friend accent colours for hexagon borders ──────────────────────────
const FRIEND_COLOURS = [
    { border: '#FF7C7C', shadow: 'rgba(255,124,124,0.45)' }, // coral
    { border: '#6B93FF', shadow: 'rgba(107,147,255,0.45)' }, // blue
    { border: '#3F7347', shadow: 'rgba(63,115,71,0.45)'  }, // green
    { border: '#FFB347', shadow: 'rgba(255,179,71,0.45)'  }, // amber
    { border: '#C77DFF', shadow: 'rgba(199,125,255,0.45)' }, // purple
]

// ─── Hexagon friend bubble ───────────────────────────────────────────────────
// Uses the exact path from Polygon 1.svg (viewBox 0 0 59 67)
// scaled to the display size, with a coloured border ring and photo fill.
function HexFriend({
    profile,
    colourIndex,
    onTap,
}: {
    profile: CookProfile
    colourIndex: number
    onTap: () => void
}) {
    const { border, shadow } = FRIEND_COLOURS[colourIndex % FRIEND_COLOURS.length]

    // Display size — keep the 59:67 aspect ratio from the SVG
    const W = 72
    const H = Math.round(W * 67 / 59)  // ≈ 82

    // The original path is defined in 59×67 space.
    // We scale a uniform transform to map 59×67 → W×H.
    const sx = W / 59
    const sy = H / 67

    // Original polygon path (from Polygon 1.svg)
    const OUTER_PATH = "M21.1001 2.34957C26.2229 -0.782049 32.6677 -0.782048 37.7905 2.34957L51.2354 10.5686C55.9903 13.4753 58.8902 18.6468 58.8902 24.2199V42.2762C58.8902 47.8493 55.9903 53.0208 51.2354 55.9275L37.7905 64.1465C32.6677 67.2781 26.2229 67.2781 21.1001 64.1465L7.65525 55.9275C2.90031 53.0208 0.000448227 47.8493 0.000448227 42.2762V24.2199C0.000448227 18.6468 2.90031 13.4753 7.65525 10.5686L21.1001 2.34957Z"

    // Border inset (px in display space)
    const BORDER = 3
    // Inner clip transform: scale then translate inward by BORDER
    // We achieve the inset by shrinking the path slightly around its centre
    const innerSx = (W - BORDER * 2) / 59
    const innerSy = (H - BORDER * 2) / 67

    const clipId = `poly-clip-${colourIndex}`

    return (
        <button
            onClick={onTap}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: W + 4 }}
        >
            <svg
                width={W}
                height={H}
                viewBox={`0 0 ${W} ${H}`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block', filter: `drop-shadow(0 3px 10px ${shadow})`, flexShrink: 0 }}
            >
                <defs>
                    <clipPath id={clipId}>
                        {/*
                          Inner shape: scale the 59×67 path down to (W-2*BORDER)×(H-2*BORDER)
                          then translate to centre it within the full W×H viewport.
                        */}
                        <path
                            d={OUTER_PATH}
                            transform={`translate(${BORDER},${BORDER}) scale(${innerSx},${innerSy})`}
                        />
                    </clipPath>
                </defs>

                {/* Coloured border — full polygon scaled to W×H */}
                <path
                    d={OUTER_PATH}
                    transform={`scale(${sx},${sy})`}
                    fill={border}
                />

                {/* White inset ring */}
                <path
                    d={OUTER_PATH}
                    transform={`translate(${BORDER},${BORDER}) scale(${innerSx},${innerSy})`}
                    fill="white"
                />

                {/* Photo — fills full viewport, clipped to inner polygon */}
                <image
                    href={profile.photoUrls[0]}
                    x={0}
                    y={0}
                    width={W}
                    height={H}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#${clipId})`}
                />
            </svg>

            <span
                style={{
                    fontSize: 12,
                    fontFamily: "'Rethink Sans', sans-serif",
                    fontWeight: 400,
                    color: '#555',
                    lineHeight: 1,
                }}
            >
                {profile.name}
            </span>
        </button>
    )
}



// ─── GathererStoryView ─────────────────────────────────────────────────────────
const POLY_PATH = "M21.1001 2.34957C26.2229 -0.782049 32.6677 -0.782048 37.7905 2.34957L51.2354 10.5686C55.9903 13.4753 58.8902 18.6468 58.8902 24.2199V42.2762C58.8902 47.8493 55.9903 53.0208 51.2354 55.9275L37.7905 64.1465C32.6677 67.2781 26.2229 67.2781 21.1001 64.1465L7.65525 55.9275C2.90031 53.0208 0.000448227 47.8493 0.000448227 42.2762V24.2199C0.000448227 18.6468 2.90031 13.4753 7.65525 10.5686L21.1001 2.34957Z"

function StoryHexAvatar({ profile, index, isActive, onClick }: { profile: CookProfile; index: number; isActive: boolean; onClick: () => void }) {
    const W = 44, H = Math.round(44 * 67 / 59)
    const sx = W / 59, sy = H / 67
    const borderColour = FRIEND_COLOURS[index % FRIEND_COLOURS.length].border
    const clipId = `story-clip-${index}`
    return (
        <button
            onClick={onClick}
            onPointerDown={e => e.stopPropagation()} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
        >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#FFE135' : 'transparent', marginBottom: -2 }} />
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{ display: 'block', opacity: isActive ? 1 : 0.55 }}>
                <defs>
                    <clipPath id={clipId}>
                        <path d={POLY_PATH} transform={`translate(2,2) scale(${(W-4)/59},${(H-4)/67})`} />
                    </clipPath>
                </defs>
                <path d={POLY_PATH} transform={`scale(${sx},${sy})`} fill={isActive ? borderColour : 'rgba(255,255,255,0.4)'} />
                <path d={POLY_PATH} transform={`translate(2,2) scale(${(W-4)/59},${(H-4)/67})`} fill="rgba(255,255,255,0.15)" />
                <image href={profile.photoUrls[0]} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
            </svg>
            <span style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: "'Rethink Sans', sans-serif", fontWeight: isActive ? 700 : 400 }}>
                {profile.name}
            </span>
        </button>
    )
}

function GathererStoryView({ profiles, startIndex, onClose }: { profiles: CookProfile[]; startIndex: number; onClose: () => void }) {
    const [personIdx, setPersonIdx] = useState(startIndex)
    const [photoIdxs, setPhotoIdxs] = useState<Record<string, number>>(
        Object.fromEntries(profiles.map(p => [p.id, 0]))
    )
    const [imprinted, setImprinted] = useState<Set<string>>(new Set())
    const [imprintAnim, setImprintAnim] = useState(false)

    // Current profile and its data
    const currentPerson = profiles[personIdx]
    const curPhotoIdx = photoIdxs[currentPerson.id] || 0
    const photos = currentPerson.recipePreviews.length > 0 ? currentPerson.recipePreviews : currentPerson.photoUrls
    const impKey = `${currentPerson.id}-${curPhotoIdx}`
    const isImprinted = imprinted.has(impKey)

    const goNextPhoto = () => {
        setPhotoIdxs(prev => ({
            ...prev,
            [currentPerson.id]: Math.min((prev[currentPerson.id] || 0) + 1, photos.length - 1)
        }))
    }
    const goPrevPhoto = () => {
        setPhotoIdxs(prev => ({
            ...prev,
            [currentPerson.id]: Math.max((prev[currentPerson.id] || 0) - 1, 0)
        }))
    }

    const handleImprint = () => {
        setImprintAnim(true)
        setImprinted(prev => { const n = new Set(prev); n.add(impKey); return n })
        setTimeout(() => setImprintAnim(false), 700)
    }

    // ── Vertical Drag / Swipe Logic ──
    const [dragY, setDragY] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)

    const onDragEnd = (_: any, info: any) => {
        const threshold = 100
        const velocity = info.velocity.y
        const offset = info.offset.y

        if (offset < -threshold || velocity < -500) {
            if (personIdx < profiles.length - 1) setPersonIdx(prev => prev + 1)
        } else if (offset > threshold || velocity > 500) {
            if (personIdx > 0) setPersonIdx(prev => prev - 1)
        }
        setDragY(0)
    }

    return (
        <motion.div
            key="story-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black overflow-hidden"
            style={{ zIndex: 60 }}
        >
            {/* ── Filmstrip Container ── */}
            <motion.div
                className="w-full h-full"
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.4}
                onDrag={(_, info) => setDragY(info.offset.y)}
                onDragEnd={onDragEnd}
                animate={{ y: -personIdx * 100 + "%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{ touchAction: 'none' }}
            >
                {profiles.map((person, idx) => {
                    const personPhotos = person.recipePreviews.length > 0 ? person.recipePreviews : person.photoUrls
                    const personPhotoIdx = photoIdxs[person.id] || 0
                    
                    return (
                        <div key={person.id} className="w-full h-full relative flex-shrink-0">
                            {/* Photos Layer */}
                            <div className="absolute inset-0">
                                <AnimatePresence initial={false}>
                                    <motion.img
                                        key={`${person.id}-${personPhotoIdx}`}
                                        src={personPhotos[personPhotoIdx]}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        style={{ pointerEvents: 'none' }}
                                    />
                                </AnimatePresence>
                            </div>

                            {/* Gradient overlay per person */}
                            <div className="absolute inset-0 pointer-events-none" style={{
                                background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 28%, transparent 62%, rgba(0,0,0,0.72) 100%)'
                            }} />

                            {/* Bottom Info Overlay (Specific to Person) */}
                            <div className="absolute left-0 right-0 bottom-0 px-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}>
                                <div className="mb-4">
                                    <h3 style={{ color: '#fff', fontSize: 20, fontFamily: "'Rethink Sans', sans-serif", fontWeight: 700, lineHeight: 1.2, marginBottom: 4 }}>{person.name}</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: "'Rethink Sans', sans-serif", fontWeight: 400, lineHeight: 1.4, maxWidth: '85%' }}>{person.caption}</p>
                                </div>
                                <div className="flex gap-1.5 items-center">
                                    {personPhotos.map((_, i) => (
                                        <div key={i} style={{ width: i === personPhotoIdx ? 22 : 6, height: 4, borderRadius: 99, background: i === personPhotoIdx ? '#FFE135' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s' }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </motion.div>

            {/* ── Fixed Static UI Layers (Always on top) ── */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                {/* Top bar */}
                <div className="absolute left-0 right-0 top-0 pointer-events-auto" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)', paddingLeft: 20, paddingRight: 20 }}>
                    {/* Progress bars (for current person) */}
                    <div className="flex gap-1.5 mb-3">
                        {photos.map((_, i) => (
                            <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= curPhotoIdx ? '#FFE135' : 'rgba(255,255,255,0.35)', opacity: i < curPhotoIdx ? 0.6 : 1 }} />
                        ))}
                    </div>

                    <div className="flex items-center justify-between mb-3">
                        <h2 style={{ color: '#fff', fontSize: 22, fontFamily: "'Rethink Sans', sans-serif", fontWeight: 700, lineHeight: 1 }}>Your Gatherers</h2>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <path d="M6 9l6 6 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {profiles.map((p, i) => (
                            <StoryHexAvatar
                                key={p.id}
                                profile={p}
                                index={i}
                                isActive={i === personIdx}
                                onClick={() => { setPersonIdx(i) }}
                            />
                        ))}
                    </div>
                </div>

                {/* Left/Right tap zones for photo navigation */}
                <div className="absolute inset-0 flex justify-between pointer-events-none" style={{ top: '25%', bottom: '25%' }}>
                    <div className="w-[35%] h-full pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); goPrevPhoto(); }} />
                    <div className="w-[35%] h-full pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); goNextPhoto(); }} />
                </div>

                {/* Imprint Button (Fixed position) */}
                <div className="absolute right-5 bottom-0 pointer-events-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
                    <motion.button
                        onClick={handleImprint}
                        animate={imprintAnim ? { scale: [1, 1.4, 0.88, 1.15, 1], rotate: [0, -14, 9, -4, 0] } : { scale: 1 }}
                        transition={{ duration: 0.55, ease: 'easeOut' }}
                        style={{ width: 58, height: 58, borderRadius: '50%', background: isImprinted ? '#7FD67F' : '#FFE135', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(0,0,0,0.4)', transition: 'background 0.3s' }}
                    >
                        <HandPalm size={28} weight={isImprinted ? 'fill' : 'regular'} color={isImprinted ? '#fff' : '#1a1a1a'} />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    )
}


// ─── Main TribePage ─────────────────────────────────────────────────────────────
export function TribePage() {
    const [storyView, setStoryView] = useState<{ startIndex: number } | null>(null)
    const [activeTab, setActiveTab] = useState<'near' | 'connects'>('near')
    const [isGraphMaximized, setIsGraphMaximized] = useState(false)
    const { currentUser } = useAuth()
    const [connections, setConnections] = useState<CookProfile[]>([])
    const [chattingWith, setChattingWith] = useState<CookProfile | null>(null)
    const [onboardingDismissed, setOnboardingDismissed] = useState(false)
    const [selectedFeedItem, setSelectedFeedItem] = useState<FeedItem | null>(null)
    const [selectedFriendProfile, setSelectedFriendProfile] = useState<CookProfile | null>(null)
    const { posts, loading: postsLoading } = usePosts()
    const { profile: tribeProfile, loading: profileLoading } = useTribeProfile()

    const handleConnect = (profile: CookProfile) => {
        setConnections(prev => prev.some(c => c.id === profile.id) ? prev : [profile, ...prev])
    }

    return (
        <>
            {/* ── Story View ── */}
            <AnimatePresence>
                {storyView && (
                    <GathererStoryView
                        profiles={MOCK_PROFILES}
                        startIndex={storyView.startIndex}
                        onClose={() => setStoryView(null)}
                    />
                )}
            </AnimatePresence>

            {/* ── Chef Profile Sheet ── */}
            <AnimatePresence>
                {selectedFeedItem && (
                    <ChefProfileSheet
                        item={selectedFeedItem}
                        onClose={() => setSelectedFeedItem(null)}
                        onConnect={() => handleConnect(selectedFeedItem.chef)}
                        isConnected={connections.some(c => c.id === selectedFeedItem.chef.id)}
                    />
                )}
            </AnimatePresence>

            {/* ── Maximized Network Graph ── */}
            <AnimatePresence>
                {isGraphMaximized && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, type: "spring", bounce: 0 }}
                        className="fixed inset-0 bg-background flex flex-col"
                        style={{ zIndex: 45 }}
                    >
                        <div className="absolute top-0 inset-x-0 p-4 pt-[calc(env(safe-area-inset-top)+16px)] flex justify-between items-center z-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                            <h2 className="text-white text-xl font-bold font-['Office_Times_Round'] drop-shadow-md pointer-events-auto">Network Graph</h2>
                            <button 
                                onClick={() => setIsGraphMaximized(false)}
                                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 pointer-events-auto hover:bg-black/60 transition-colors"
                            >
                                <X size={20} weight="bold" />
                            </button>
                        </div>
                        <div className="flex-1 relative min-h-0">
                            <ConnectionsGraph
                                connections={connections}
                                currentUserPhoto={currentUser?.photoURL || tribeProfile?.photoUrls?.[0] || ''}
                                currentUserName={currentUser?.displayName || tribeProfile?.displayName || 'Me'}
                                onToggleMaximize={() => setIsGraphMaximized(false)}
                                maximized={true}
                                onNodeClick={(nodeId) => {
                                    const chef = connections.find(c => c.id === nodeId);
                                    if (chef) {
                                        setSelectedFeedItem({
                                            chef,
                                            id: chef.id,
                                            heightVariant: 1,
                                            photoUrl: chef.recipePreviews[0] || chef.photoUrls[0]
                                        })
                                    }
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Chat View ── */}
            <AnimatePresence>
                {chattingWith && (
                    <TribeChat
                        otherUser={{
                            id: chattingWith.id,
                            name: chattingWith.name,
                            photoUrl: chattingWith.photoUrls[0],
                        }}
                        onClose={() => setChattingWith(null)}
                    />
                )}
            </AnimatePresence>

            {/* ── Friend profile sheet (opened from hexagon click) ── */}
            <AnimatePresence>
                {selectedFriendProfile && (
                    <ChefProfileSheet
                        item={{
                            id: selectedFriendProfile.id,
                            photoUrl: selectedFriendProfile.recipePreviews[0] || selectedFriendProfile.photoUrls[0],
                            chef: selectedFriendProfile,
                            heightVariant: 1,
                        }}
                        onClose={() => setSelectedFriendProfile(null)}
                        onConnect={() => handleConnect(selectedFriendProfile)}
                        isConnected={connections.some(c => c.id === selectedFriendProfile.id)}
                    />
                )}
            </AnimatePresence>

            {/* ── Main Scrollable Page ── */}
            <div className="min-h-screen bg-background pb-28">
                {/* ── Sticky Header ── */}
                <div className="pt-[calc(env(safe-area-inset-top)+20px)] px-5 pb-3 flex items-center justify-between sticky top-0 z-40 bg-background/90 backdrop-blur-md" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <h1 className="text-3xl font-bold">Gatherers</h1>
                    <div className="flex bg-muted/60 backdrop-blur-md p-1 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('near')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'near' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                        >
                            Inspo
                        </button>

                        <button
                            onClick={() => setActiveTab('connects')}
                            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'connects' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                        >
                            <span>Connects</span>
                            {connections.length > 0 && (
                                <span className="bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center -mr-1">
                                    {connections.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Hexagon Friends Row (always visible) ── */}
                <div
                    className="flex gap-3 px-5 py-4 overflow-x-auto no-scrollbar"
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
                >
                    {MOCK_PROFILES.map((p, i) => (
                        <HexFriend
                            key={p.id}
                            profile={p}
                            colourIndex={i}
                            onTap={() => setStoryView({ startIndex: i })}
                        />
                    ))}

                </div>

                {/* ── Tabs Content ── */}

                {/* 1. Connects Tab */}
                {activeTab === 'connects' && (
                    <div className="px-5 mt-6 pb-8 flex flex-col gap-6">
                        <div className="w-full">
                            <ConnectionsGraph
                                connections={connections}
                                currentUserPhoto={currentUser?.photoURL || tribeProfile?.photoUrls?.[0] || ''}
                                currentUserName={currentUser?.displayName || tribeProfile?.displayName || 'Me'}
                                onToggleMaximize={() => setIsGraphMaximized(true)}
                                maximized={false}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h2 className="text-lg font-bold font-['Office_Times_Round'] mb-2">Recent Connects</h2>
                            {connections.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
                                    <UsersThree size={32} className="mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">Leave Imprints on chefs in the window to connect!</p>
                                </div>
                            ) : (
                                connections.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setChattingWith(c)}
                                        className="w-full bg-card flex items-center gap-4 p-3 rounded-2xl border border-border/40 hover:bg-muted/50 transition-colors text-left"
                                    >
                                        <div className="relative shrink-0">
                                            <img
                                                src={c.photoUrls[0]}
                                                alt={c.name}
                                                className="w-14 h-14 rounded-xl object-cover"
                                            />
                                            <span className="absolute -bottom-1 -right-1 text-[10px] bg-background flex items-center justify-center w-5 h-5 rounded-full border border-border p-0.5 leading-none">
                                                {RANK_ICONS[c.rank]}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline justify-between mb-0.5">
                                                <h3 className="font-semibold text-base truncate pr-2">{c.name}</h3>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">2h ago</span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground truncate opacity-80">
                                                Met over: <span className="text-foreground font-medium">Their {c.foodPreferences[0] || 'delicious'} dish</span>
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}


                {/* ── Foodies near you grid (Inspo only) ── */}
                {activeTab === 'near' && (
                    <div className="px-5 mb-8 mt-4">
                        {/* Section label in the style of the screenshot */}
                        <div className="flex items-center gap-3 mb-4">
                            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.10)' }} />
                            <span
                                style={{
                                    fontSize: 12,
                                    fontFamily: "'Rethink Sans', sans-serif",
                                    fontWeight: 400,
                                    color: '#999',
                                    letterSpacing: 0.3,
                                }}
                            >
                                Foodies near you
                            </span>
                            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.10)' }} />
                        </div>

                        <FoodDiscoveryGrid
                            profiles={MOCK_PROFILES}
                            onPhotoTap={(item) => {
                                const idx = MOCK_PROFILES.findIndex(p => p.id === item.chef.id);
                                if (idx !== -1) setStoryView({ startIndex: idx });
                            }}
                        />
                    </div>
                )}
            </div>
        </>
    )
}
