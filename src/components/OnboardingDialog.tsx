import { useState, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Heart, User, Camera, Check, ArrowDown, ArrowUp, CaretLeft } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export interface OnboardingData {
    name: string
    photo: string | null // Data URL
    preferences: string[]
}

interface OnboardingDialogProps {
    open: boolean
    onComplete: (data: OnboardingData) => void
    onSkip: () => void
}

const FOOD_PREFERENCES = [
    'Italian', 'Mexican', 'Chinese', 'Indian', 'Japanese', 'Thai',
    'Mediterranean', 'French', 'Korean', 'Vietnamese', 'Middle Eastern',
    'Greek', 'Spanish', 'American', 'Comfort Food', 'Healthy',
    'Quick & Easy', 'Vegetarian', 'Vegan', 'BBQ', 'Baking', 'Desserts'
]

export function OnboardingDialog({ open, onComplete, onSkip }: OnboardingDialogProps) {
    const [step, setStep] = useState(0) // 0: Welcome, 1: Profile, 2: Preferences

    // Data State
    const [name, setName] = useState('')
    const [photo, setPhoto] = useState<string | null>(null)
    const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])
    const [customInput, setCustomInput] = useState('')
    const [customPreferences, setCustomPreferences] = useState<string[]>([])

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image too large. Please choose a smaller image.')
                return
            }
            const reader = new FileReader()
            reader.onload = (e) => {
                setPhoto(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handlePreferenceClick = (preference: string) => {
        setSelectedPreferences(prev =>
            prev.includes(preference)
                ? prev.filter(p => p !== preference)
                : [...prev, preference]
        )
    }

    const handleAddCustomPreference = () => {
        const newPrefs = customInput
            .split(',')
            .map(p => p.trim())
            .filter(p => p.length > 0 && !customPreferences.includes(p) && !selectedPreferences.includes(p))

        if (newPrefs.length > 0) {
            setCustomPreferences(prev => [...prev, ...newPrefs])
            setCustomInput('')
        }
    }

    const handleFinish = () => {
        onComplete({
            name,
            photo,
            preferences: [...selectedPreferences, ...customPreferences]
        })
    }

    const nextStep = () => setStep(prev => prev + 1)
    const prevStep = () => setStep(prev => Math.max(0, prev - 1))

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="!h-screen !w-screen !max-w-none !top-0 !left-0 !translate-x-0 !translate-y-0 rounded-none p-0 bg-background border-none overflow-hidden">
                <div className="absolute top-4 right-4 z-50">
                    <Button variant="ghost" onClick={onSkip} className="text-muted-foreground hover:text-foreground">
                        Skip
                    </Button>
                </div>

                {/* Vertical Slider Container */}
                <div
                    className="h-[300vh] w-full transition-transform duration-700 ease-in-out will-change-transform"
                    style={{ transform: `translateY(-${step * 100}vh)` }}
                >
                    {/* STEP 0: Welcome */}
                    <div className="h-[100vh] w-full flex flex-col items-center justify-center p-6 text-center space-y-8">
                        <div className="bg-[#AA624D]/10 p-8 rounded-full animate-in zoom-in duration-500">
                            <Heart size={80} weight="fill" className="text-[#AA624D]" />
                        </div>
                        <div className="space-y-4 max-w-lg">
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Welcome to Foodi</h2>
                            <p className="text-xl text-muted-foreground">
                                Your personal recipe vault and meal planner. Let's get your profile set up.
                            </p>
                        </div>
                        <Button
                            size="lg"
                            className="bg-[#AA624D] hover:bg-[#AA624D]/90 text-white min-w-[200px] h-14 text-lg rounded-full shadow-lg mt-8"
                            onClick={nextStep}
                        >
                            Get Started
                            <ArrowDown className="ml-2 h-5 w-5 animate-bounce" />
                        </Button>
                    </div>

                    {/* STEP 1: Profile & Name */}
                    <div className="h-[100vh] w-full flex flex-col items-center justify-center p-6 text-center space-y-10 relative">
                        {/* Back Button */}
                        <Button
                            variant="ghost"
                            className="absolute top-8 left-8 text-muted-foreground hover:text-foreground"
                            onClick={prevStep}
                        >
                            <ArrowUp className="mr-2 h-4 w-4" />
                            Back
                        </Button>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold">Tell us about you</h2>
                            <p className="text-lg text-muted-foreground">Add a photo and choose a nickname</p>
                        </div>

                        <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className={cn(
                                    "w-40 h-40 rounded-full flex items-center justify-center border-4 border-dashed border-muted transition-all duration-300 bg-muted/20",
                                    photo ? "border-[#AA624D] shadow-xl" : "hover:border-[#AA624D]/50 hover:bg-muted/40"
                                )}>
                                    {photo ? (
                                        <img src={photo} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <User size={64} className="text-muted-foreground/40" weight="light" />
                                    )}
                                </div>
                                <div className="absolute bottom-1 right-1 bg-[#AA624D] text-white p-2.5 rounded-full shadow-lg hover:bg-[#AA624D]/90 transition-transform hover:scale-110">
                                    <Camera size={20} weight="bold" />
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoSelect}
                                />
                            </div>

                            <div className="w-full space-y-4">
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your Name or Nickname"
                                    className="text-center text-2xl h-14 rounded-xl shadow-sm focus-visible:ring-[#AA624D]"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && name.trim()) nextStep()
                                    }}
                                />
                                <Button
                                    disabled={!name.trim()}
                                    size="lg"
                                    className="w-full h-12 text-lg"
                                    onClick={nextStep}
                                >
                                    Continue
                                    <ArrowDown className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* STEP 2: Preferences (Fixed Layout) */}
                    <div className="h-[100vh] w-full flex flex-col pt-16 pb-8 px-6 relative">
                        {/* Back Button */}
                        <Button
                            variant="ghost"
                            className="absolute top-8 left-8 text-muted-foreground hover:text-foreground z-10"
                            onClick={prevStep}
                        >
                            <ArrowUp className="mr-2 h-4 w-4" />
                            Back
                        </Button>

                        {/* Fixed Header */}
                        <div className="text-center space-y-2 shrink-0 pb-6 pt-8 md:pt-4">
                            <h2 className="text-3xl font-bold">What do you like to eat?</h2>
                            <p className="text-lg text-muted-foreground">Select your favorites</p>
                        </div>

                        {/* Scrollable Grid Area */}
                        <div className="flex-1 overflow-y-auto min-h-0 w-full max-w-5xl mx-auto border-y border-muted/20 scrollbar-hide">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4 pb-8">
                                {FOOD_PREFERENCES.map((preference) => (
                                    <Button
                                        key={preference}
                                        variant={selectedPreferences.includes(preference) ? 'default' : 'outline'}
                                        onClick={() => handlePreferenceClick(preference)}
                                        className={cn(
                                            "h-14 text-sm relative transition-all duration-200",
                                            selectedPreferences.includes(preference)
                                                ? "bg-[#AA624D] hover:bg-[#AA624D]/90 border-[#AA624D] shadow-md transform scale-105"
                                                : "hover:border-[#AA624D]/50"
                                        )}
                                    >
                                        {preference}
                                        {selectedPreferences.includes(preference) && (
                                            <Check size={18} weight="bold" className="absolute top-2 right-2 text-white/80" />
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Fixed Footer */}
                        <div className="max-w-md mx-auto w-full space-y-4 shrink-0 pt-6">
                            <div className="space-y-2">
                                <Input
                                    placeholder="Add other cuisines..."
                                    value={customInput}
                                    onChange={(e) => {
                                        setCustomInput(e.target.value)
                                        if (e.target.value.includes(',')) handleAddCustomPreference()
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddCustomPreference()
                                    }}
                                    className="h-12"
                                />
                                {(selectedPreferences.length > 0 || customPreferences.length > 0) && (
                                    <div className="flex flex-wrap gap-2 justify-center pt-2 max-h-[80px] overflow-y-auto">
                                        {[...selectedPreferences, ...customPreferences].map((pref) => (
                                            <Badge key={pref} variant="secondary" className="px-3 py-1 bg-[#AA624D]/10 text-[#AA624D]">
                                                {pref}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button
                                size="lg"
                                onClick={handleFinish}
                                className="w-full bg-[#AA624D] hover:bg-[#AA624D]/90 text-white h-14 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                            >
                                Complete Setup
                                <Check className="ml-2 h-5 w-5" weight="bold" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
