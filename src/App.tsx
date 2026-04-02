import { useState, useLayoutEffect, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { updateProfile as updateAuthProfile } from 'firebase/auth'

// Context & Libs
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '@/hooks/use-user-profile'
import { useAppUrl } from '@/hooks/use-app-url'
import { storage } from '@/lib/firebase'
import { Recipe } from '@/lib/types'
import { cookingSessionManager, CookingSession } from '@/lib/cooking-session'
import { ReviewDialogWrapper } from '@/components/ReviewDialogWrapper'
import { getCategoryImage } from '@/lib/categoryImages'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Gear, Bell, SignOut, PencilSimple } from '@phosphor-icons/react'

// Components
import { TabNav } from '@/components/TabNav'
import { AuthPage } from '@/components/AuthPage'
import { Profile } from '@/components/Profile'
import { ProfilePublic } from '@/components/ProfilePublic'
import { OnboardingDialog, OnboardingData } from '@/components/OnboardingDialog'
import { SettingsDialog } from '@/components/SettingsDialog'

// Pages
import { RecipesPage } from '@/pages/RecipesPage'
import { ProgressPage } from '@/pages/ProgressPage' // Kept for reference but not used
// import { ProgressPage } from '@/pages/ProgressPage'
import { PlanPageWrapper } from '@/pages/PlanPageWrapper'
import { GatherPage } from '@/pages/GatherPage'
import { TribePage } from '@/pages/TribePage'

// Cook Flow (Global)
import { CookDialog } from '@/components/CookDialog'
import { CookingMode } from '@/components/CookingMode'

function SettingsDropdown({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { logout } = useAuth()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
          <Gear size={20} weight="fill" className="text-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenSettings}>
          <PencilSimple className="mr-2 h-4 w-4" />
          <span>Profile & Attributes</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info('Notifications coming soon!')}>
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500">
          <SignOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MainContent() {
  const { currentUser, loading } = useAuth()
  const { profile, updateProfile, loading: profileLoading } = useUserProfile()

  // Handle incoming shared URLs from iOS Share Extension
  const [sharedUrl, setSharedUrl] = useState<string | null>(null)
  useAppUrl((url) => {
    console.log('[App] Received shared URL:', url)
    setSharedUrl(url)
    setActiveTab('you')
    toast.info('Recipe URL received! Extracting...')
  })

  // Navigation State
  const [activeTab, setActiveTab] = useState<'cook' | 'shop' | 'tribe' | 'you'>(() => {
    const saved = localStorage.getItem('activeTab')
    const tabMap: Record<string, 'cook' | 'shop' | 'tribe' | 'you'> = {
      // Legacy migration
      'community': 'tribe',
      'progress': 'you',
      'stash': 'you',
      // Current
      'cook': 'cook',
      'shop': 'shop',
      'tribe': 'tribe',
      'you': 'you',
    }
    return (tabMap[saved || ''] || 'you') as 'cook' | 'shop' | 'tribe' | 'you'
  })

  // Global UI State
  const [navHovered, setNavHovered] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Cook Flow State
  const [showPromptDialog, setShowPromptDialog] = useState(false)
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null)

  // Settings Dialog
  const [showSettings, setShowSettings] = useState(false)

  // Global Review Prompt State
  const [pendingReviewSession, setPendingReviewSession] = useState<CookingSession | null>(null)

  // Check for pending reviews periodically
  useEffect(() => {
    const checkReviews = () => {
      const session = cookingSessionManager.getPendingReview()
      if (session) {
        setPendingReviewSession(session)
        // Mark as shown so we don't spam
        cookingSessionManager.markAsPrompShown(session.recipeId)
      }
    }

    // Check immediately on mount/load
    checkReviews()

    // Check every minute
    const interval = setInterval(checkReviews, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Effects
  useLayoutEffect(() => {
    if (!loading && !profileLoading && currentUser && profile && profile.onboardingCompleted === false) {
      setShowOnboarding(true)
    }
  }, [loading, profileLoading, currentUser, profile])

  useEffect(() => {
    const handleNavHover = (event: any) => {
      setNavHovered(event.detail.isHovered)
    }
    window.addEventListener('nav-hover', handleNavHover)
    return () => window.removeEventListener('nav-hover', handleNavHover)
  }, [])

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab)
  }, [activeTab])

  // Global Image Preloader (DOM-based)
  // Forces browser to decode and keep images ready
  const HiddenImagePreloader = () => {
    const categories = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Drinks', 'All']
    return (
      <div style={{ display: 'none' }} aria-hidden="true">
        {categories.map((cat) => (
          <img
            key={cat}
            src={getCategoryImage(cat as any)}
            alt=""
            loading="eager"
            fetchPriority="high"
          />
        ))}
      </div>
    )
  }



  // Handlers
  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      let photoURL = profile.photoURL || currentUser?.photoURL || undefined
      if (data.photo) {
        const response = await fetch(data.photo)
        const blob = await response.blob()
        const fileExtension = blob.type.split('/')[1] || 'jpg'
        const storageRef = ref(storage, `users/${currentUser!.uid}/profile.${fileExtension}`)
        await uploadBytes(storageRef, blob)
        photoURL = await getDownloadURL(storageRef)
        await updateAuthProfile(currentUser!, { photoURL })
      }
      await updateProfile({
        familyCookName: data.name,
        foodPreferences: data.preferences,
        onboardingCompleted: true,
        photoURL
      })
      setShowOnboarding(false)
      toast.success(`Welcome to Forage, ${data.name}! 🌿`)
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message || 'Unknown error'}`)
    }
  }

  const handleOnboardingSkip = () => {
    updateProfile({ onboardingCompleted: true })
    setShowOnboarding(false)
    toast.info('You can complete your profile anytime in Settings')
  }

  // Render Logic
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )

  if (loading || (currentUser && profileLoading)) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )

  if (!currentUser) return <AuthPage />

  return (
    <>
      <TabNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'cook') {
            setShowPromptDialog(true)
          } else {
            setActiveTab(tab)
          }
        }}
      />

      <div className={`min-h-screen bg-background pb-20 md:pb-0 transition-all duration-300 ${navHovered ? 'md:pl-52' : 'md:pl-20'}`}>
        <Toaster position="top-center" />

        {/* Global Page Router */}
        {activeTab === 'shop' ? (
          <GatherPage />
        ) : activeTab === 'you' ? (
          <>
            {/* You — Profile + Photos */}
            <div className="pt-[calc(env(safe-area-inset-top)+24px)] pb-3 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0">
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                      {(profile.familyCookName || currentUser?.displayName || currentUser?.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="text-sm font-bold">
                  Welcome back, {profile.familyCookName || currentUser?.displayName || currentUser?.email?.split('@')[0]}
                </p>
              </div>
              <SettingsDropdown onOpenSettings={() => setShowSettings(true)} />
            </div>
            <div className="max-w-7xl mx-auto space-y-8">
              <Profile
                sharedUrl={sharedUrl}
                onUrlHandled={() => setSharedUrl(null)}
              />
            </div>
          </>
        ) : activeTab === 'tribe' ? (
          <TribePage />
        ) : null}

        {/* Global Overlays */}
        <CookDialog
          open={showPromptDialog}
          onClose={() => setShowPromptDialog(false)}
          onGenerate={(recipe) => {
            setCookingRecipe(recipe)
            setShowPromptDialog(false)
          }}
          onOpenExtract={() => {
            setActiveTab('you')
            toast.info("Switched to Profile")
          }}
        />

        <CookingMode
          open={!!cookingRecipe}
          recipe={cookingRecipe}
          onClose={() => setCookingRecipe(null)}
          onEdit={() => { }}
          onComplete={() => {
            if (cookingRecipe) {
              cookingSessionManager.completeSession(cookingRecipe)
            }
            // Stub: In a real app we might prompt to post this.
            // But since we decoupled, we just close.
            setCookingRecipe(null)
          }}
        />

        <OnboardingDialog
          open={showOnboarding}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />

        <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />

        {/* Global Review Prompt */}
        <ReviewDialogWrapper
          open={!!pendingReviewSession}
          initialRating={0}
          recipe={pendingReviewSession ? {
            id: pendingReviewSession.recipeId,
            userId: pendingReviewSession.ownerId,
            name: pendingReviewSession.recipeName,
            // Partial recipe object is enough for ReviewDialogWrapper's useReviews hook usage 
            // as long as it has id and userId.
          } as any : null}
          onClose={() => {
            if (pendingReviewSession) {
              cookingSessionManager.dismissReview(pendingReviewSession.recipeId)
              setPendingReviewSession(null)
            }
          }}
          onReviewAdded={() => {
            if (pendingReviewSession) {
              cookingSessionManager.markAsReviewed(pendingReviewSession.recipeId)
              setPendingReviewSession(null)
            }
          }}
        />
        <HiddenImagePreloader />
      </div>
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/user/:userId" element={<ProfilePublic />} />
      <Route path="/*" element={<MainContent />} />
    </Routes>
  )
}

export default App
