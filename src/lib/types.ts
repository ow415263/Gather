export type RecipeCategory = 'All' | 'Breakfast' | 'Lunch' | 'Dinner' | 'Dessert' | 'Snacks' | 'Drinks'

export interface RecipeCourse {
  name: string
  ingredients: string[]
  instructions: string[]
}

export interface Recipe {
  id: string
  userId: string // Owner ID
  name: string
  description: string
  category: RecipeCategory
  prepTime: number
  cookTime: number
  servings: number
  ingredients: string[]
  instructions: string[]
  courses?: RecipeCourse[]
  imageUrl?: string
  createdAt: number
  rating?: number // 1-5 stars
  reviewCount?: number
  tags?: string[]
  isSaved?: boolean
}

export interface Review {
  id: string
  recipeId: string
  userId: string
  userName: string
  userPhotoUrl?: string
  rating: number // 1-5
  text: string
  images?: string[]
  isPublic: boolean
  createdAt: number
  helpfulCount: number
}

export interface RecipeFormData {
  name: string
  description: string
  category: RecipeCategory
  prepTime: string
  cookTime: string
  servings: string
  ingredients: string[]
  instructions: string[]
  imageUrl?: string
  tags?: string[]
}

export interface ExtractedRecipeData {
  name: string
  description: string
  category: RecipeCategory
  prepTime: number
  cookTime: number
  servings: number
  ingredients: string[]
  instructions: string[]
  courses?: RecipeCourse[]
  imageUrl?: string
  tags?: string[]
}

export interface ShoppingListItem {
  id: string
  name: string
  checked: boolean
  createdAt: number
}

export interface ShoppingList {
  id: string
  name: string
  items: ShoppingListItem[]
  createdAt: number
  updatedAt: number
}

export interface CookingPost {
  id: string
  userId: string
  userName: string // Cached from user profile
  userPhotoUrl?: string // Cached from user profile
  recipeId?: string // Now optional
  recipeName?: string // Now optional
  recipeCategory?: RecipeCategory // Now optional
  imageUrl?: string // Photo of the cooked dish
  videoUrl?: string // Video of the cooked dish
  caption?: string // Optional user notes/caption
  likes: number // Count of likes (heart)
  fires: number // Count of fire reactions
  chefHats: number // Count of chef hat reactions
  commentCount: number // Count of comments
  createdAt: number
}

export interface PostLike {
  id: string
  postId: string
  userId: string
  createdAt: number
}

export interface PostComment {
  id: string
  postId: string
  userId: string
  userName: string
  userPhotoUrl?: string
  text: string
  createdAt: number
}

// ─── Gamification ────────────────────────────────────────────────────────────

export type ForageRank = 'Scout' | 'Gatherer' | 'Hunter' | 'Elder'

export interface Artifact {
  id: string
  name: string
  description: string
  iconName: string // Phosphor icon name reference
  unlockCondition: string
  dateUnlocked?: number
}

export interface UserProgress {
  userId: string
  rank: ForageRank
  totalRecipesCooked: number
  totalTribePosts: number
  totalReviewsWritten: number
  totalConversationsStarted: number
  unlockedArtifacts: string[] // Artifact IDs
  updatedAt: number
}

// ─── Gather Tab — Loyalty Cards ───────────────────────────────────────────────

export interface LoyaltyCard {
  id: string
  userId: string
  storeName: string                          // e.g. "PC Optimum", "Scene+", "Moi"
  cardImageUrl: string                       // Firebase Storage URL — full card photo
  barcodeImageUrl?: string                   // Cropped barcode/QR for fast display
  barcodeType?: 'barcode' | 'qr' | 'unknown'
  displayColor?: string                      // Hex colour for UI theming
  order: number                              // User-defined sort order
  isPrimary: boolean                         // Show first / one-tap access
  createdAt: number
  updatedAt: number
}

// ─── Tribe Tab ────────────────────────────────────────────────────────────────

export interface TribeProfile {
  userId: string
  displayName: string
  photoUrl?: string
  bio?: string
  favouriteCuisines: string[]
  dietaryStyle?: string[]
  rank: ForageRank
  totalRecipesCooked: number
  postCount: number
  // Location — approximate (geohash only, never raw lat/lng)
  geohash?: string
  locationLabel?: string                     // e.g. "Toronto, ON"
  // Privacy — both default false
  isDiscoverable: boolean
  locationEnabled: boolean
  lastActiveAt: number
  createdAt: number
  updatedAt: number
}

export interface TribePost {
  id: string
  userId: string
  userDisplayName: string
  userPhotoUrl?: string
  userRank: ForageRank
  recipeId?: string
  recipeName?: string
  recipeCategory?: RecipeCategory
  imageUrl?: string
  videoUrl?: string
  caption?: string
  // Reaction counts (denormalised — no public counts shown in feed)
  likeCount: number
  fireCount: number
  chefHatCount: number
  commentCount: number
  // Visibility — default private, prompted in-context after posting
  isPublic: boolean
  geohash?: string                           // Only set if locationEnabled === true
  createdAt: number
}

export interface TribeComment {
  id: string
  postId: string
  userId: string
  userDisplayName: string
  userPhotoUrl?: string
  text: string
  createdAt: number
}

export type TribeReactionType = 'like' | 'fire' | 'chefHat'

export interface TribeReaction {
  id: string            // = userId (one reaction type per user per post)
  userId: string
  type: TribeReactionType
  createdAt: number
}

export interface TribeConversation {
  id: string
  participantIds: [string, string]
  initiatedFromPostId?: string               // Post that sparked the convo
  lastMessage: string
  lastMessageAt: number
  lastMessageUserId: string
  unreadCount: Record<string, number>        // { [userId]: count }
  createdAt: number
}

export interface TribeMessage {
  id: string
  conversationId: string
  senderId: string
  text: string
  imageUrl?: string
  readAt?: number
  createdAt: number
}

// ─── Legacy (kept for backward compatibility) ─────────────────────────────────

export interface CircleActivity {
  id: string
  userId: string
  userName: string
  userPhotoUrl?: string
  action: 'cooked' | 'unlocked' | 'joined'
  recipeId?: string
  recipeName?: string
  artifactName?: string
  timestamp: number
  reactions: string[]
}
