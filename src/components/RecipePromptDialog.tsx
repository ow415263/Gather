import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MagicWand, X, ArrowRight, ChefHat, Fire, Timer, Heart } from '@phosphor-icons/react'
import { useUserProfile } from '@/hooks/use-user-profile'
import { useGenerateRecipe, RefinementData } from '@/hooks/use-generate-recipe'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { Recipe } from '@/lib/types'

interface RecipePromptDialogProps {
    open: boolean
    onClose: () => void
    onGenerate?: (recipe: Recipe) => void
}

type Step = 'input' | 'refining'

export function RecipePromptDialog({ open, onClose, onGenerate }: RecipePromptDialogProps) {
    const [step, setStep] = useState<Step>('input')
    const [prompt, setPrompt] = useState('')
    const [suggestions, setSuggestions] = useState<RefinementData | null>(null)
    const [selectedCuisine, setSelectedCuisine] = useState<string | undefined>(undefined)
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    const { profile } = useUserProfile()
    const { generate, refine, isGenerating, isRefining } = useGenerateRecipe()

    const handleClose = () => {
        onClose()
        // Reset state after transition
        setTimeout(() => {
            setStep('input')
            setPrompt('')
            setSuggestions(null)
            setSelectedCuisine(undefined)
            setSelectedTags([])
        }, 300)
    }

    const handleNext = async () => {
        if (!prompt.trim()) return

        const data = await refine(prompt, profile)
        if (data) {
            setSuggestions(data)
            setStep('refining')
        } else {
            // Fallback to direct generation if refinement fails
            handleGenerate()
        }
    }

    const handleGenerate = async () => {
        try {
            const recipe = await generate(prompt, profile, selectedCuisine, selectedTags)
            onGenerate?.(recipe as unknown as Recipe) // Casting primarily because create dates might differ slightly in types
            handleClose()
        } catch (error) {
            // Error handled in hook
        }
    }

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        )
    }

    // Get preferences string for display
    const preferences = profile?.foodPreferences?.length
        ? profile.foodPreferences.join(', ')
        : null

    return (
        <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-none w-screen h-screen rounded-none border-none bg-background p-0 flex flex-col [&>button]:hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-4 pt-[calc(env(safe-area-inset-top)+24px)] sm:p-8 gap-3">
                    <DialogTitle className="text-2xl sm:text-3xl font-bold text-left pt-2">
                        {step === 'input' ? 'What are you craving?' : 'Refine your dish'}
                    </DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="rounded-full h-12 w-12 hover:bg-muted shrink-0"
                        disabled={isGenerating || isRefining}
                    >
                        <X size={24} weight="bold" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-2xl mx-auto w-full gap-8 overflow-y-auto">

                    {step === 'input' ? (
                        <div className="flex-1 flex flex-col gap-6 animate-in slide-in-from-left-4 fade-in duration-300">
                            <div className="relative flex-1 min-h-[200px]">
                                <Textarea
                                    placeholder="E.g., Something spicy with chicken, or I have kale and pasta..."
                                    className="w-full h-full text-lg sm:text-2xl p-6 leading-relaxed resize-none border-2 border-muted hover:border-muted-foreground/50 focus:border-primary rounded-3xl transition-all"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    disabled={isGenerating || isRefining}
                                />
                                <div className="absolute bottom-6 right-6 pointer-events-none">
                                    <MagicWand size={32} weight="fill" className="text-muted-foreground/20" />
                                </div>
                            </div>

                            {preferences && (
                                <div className="flex items-start gap-3 bg-accent/10 p-4 rounded-xl border border-accent/20">
                                    <MagicWand size={20} weight="fill" className="text-purple-500 mt-0.5 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm">Smart Context Active</p>
                                        <p className="text-sm text-muted-foreground">
                                            We'll adapt the recipe for your <strong>{preferences}</strong> preferences.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-8 animate-in slide-in-from-right-4 fade-in duration-300">
                            {/* Cuisines */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <ChefHat size={24} className="text-primary" />
                                    What direction?
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {suggestions?.cuisines.map((cuisine) => (
                                        <button
                                            key={cuisine}
                                            onClick={() => setSelectedCuisine(cuisine === selectedCuisine ? undefined : cuisine)}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 text-left transition-all hover:border-primary/50",
                                                selectedCuisine === cuisine
                                                    ? "border-primary bg-primary/5 shadow-md"
                                                    : "border-muted bg-card hover:bg-accent/5"
                                            )}
                                        >
                                            <span className="font-medium">{cuisine}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Timer size={24} className="text-primary" />
                                    Any constraints?
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {suggestions?.tags.map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={cn(
                                                "px-4 py-2 rounded-full border-2 text-sm font-medium transition-all",
                                                selectedTags.includes(tag)
                                                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                                    : "border-muted hover:border-primary/50 bg-background"
                                            )}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <Button
                        size="lg"
                        className="w-full h-16 text-lg rounded-full font-bold gap-3 shadow-lg hover:shadow-xl transition-all mt-auto"
                        onClick={step === 'input' ? handleNext : handleGenerate}
                        disabled={!prompt.trim() || isGenerating || isRefining}
                    >
                        {isGenerating || isRefining ? (
                            <>
                                <MagicWand size={24} className="animate-spin" />
                                {isRefining ? 'Asking Chef...' : 'Cooking it up...'}
                            </>
                        ) : step === 'input' ? (
                            <>
                                Ask Chef
                                <ArrowRight size={24} weight="bold" />
                            </>
                        ) : (
                            <>
                                Generate Recipe
                                <Fire size={24} weight="fill" />
                            </>
                        )}
                    </Button>

                </div>
            </DialogContent>
        </Dialog>
    )
}
