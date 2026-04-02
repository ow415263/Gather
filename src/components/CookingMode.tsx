import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, ArrowRight, ArrowLeft, ShoppingCart, SpeakerHigh, SpeakerSlash, CheckCircle, Camera, Fire, ChefHat, CaretDown, PencilSimple, Plus } from '@phosphor-icons/react'
import { Recipe } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { useUserProfile } from '@/hooks/use-user-profile'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import JSConfetti from 'js-confetti'
import { Badge } from '@/components/ui/badge'

import { RewardDialog } from '@/components/RewardDialog'

interface CookingModeProps {
    open: boolean
    recipe: Recipe | null
    onClose: () => void
    onEdit: () => void
    onComplete: (shouldPost: boolean) => void
}

type CookingStage = 'prep' | 'cook' | 'complete'

export function CookingMode({ open, recipe, onClose, onEdit, onComplete }: CookingModeProps) {
    const [stage, setStage] = useState<CookingStage>('prep')
    const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())
    const [currentStep, setCurrentStep] = useState(0)
    const [voiceEnabled, setVoiceEnabled] = useState(false)
    const { profile } = useUserProfile()

    const handleShare = async () => {
        const shareData = {
            title: `I just cooked ${recipe?.name}!`,
            text: `Cooked ${recipe?.name} using Fudi!`,
            url: window.location.href // Or deep link if available
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData)
                toast.success('Shared successfully!')
            } catch (err) {
                console.error('Error sharing:', err)
            }
        } else {
            // Fallback for browsers ensuring action
            toast.info('Copied link to clipboard!')
            navigator.clipboard.writeText(shareData.url)
        }
    }

    // Reset state when opening new recipe
    useEffect(() => {
        if (open) {
            setStage('prep')
            setCheckedIngredients(new Set())
            setCurrentStep(0)
        }
    }, [open, recipe])

    if (!open || !recipe) return null

    const toggleIngredient = (index: number) => {
        const newSet = new Set(checkedIngredients)
        if (newSet.has(index)) {
            newSet.delete(index)
        } else {
            newSet.add(index)
        }
        setCheckedIngredients(newSet)
    }

    const startCooking = () => {
        setStage('cook')
    }

    const addToGroceries = () => {
        const missingCount = recipe.ingredients.length - checkedIngredients.size
        if (missingCount > 0) {
            toast.message(`Added ${missingCount} items to groceries`, {
                description: "Synced to your shopping list"
            })
            // In a real app, this would call a hook to add items
        }
    }

    const nextStep = () => {
        if (currentStep < recipe.instructions.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            setStage('complete')
            const jsConfetti = new JSConfetti()
            jsConfetti.addConfetti({
                emojis: ['👨‍🍳', '🔥', '🥘', '✨'],
                confettiNumber: 60,
            })
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        } else {
            setStage('prep')
        }
    }

    const progress = ((currentStep + 1) / recipe.instructions.length) * 100
    const allIngredientsChecked = checkedIngredients.size === recipe.ingredients.length

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: '100%' }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[60] bg-background flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-4 pt-[calc(env(safe-area-inset-top)+16px)] border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <CaretDown size={28} weight="bold" />
                        </Button>

                        {stage === 'cook' && (
                            <div className="flex-1 max-w-[200px] mx-4 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        )}

                        {stage === 'prep' ? (
                            <Button variant="ghost" size="icon" onClick={onEdit} className="rounded-full">
                                <PencilSimple size={24} weight="bold" />
                            </Button>
                        ) : (
                            <div className="w-10" />
                        )}
                    </div>

                    <div className="flex-1 overflow-hidden relative flex flex-col">
                        {/* PREP STAGE */}
                        {stage === 'prep' && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex-1 flex flex-col p-6 overflow-hidden"
                            >
                                <div className="space-y-4 mb-6 flex-shrink-0">
                                    <div>
                                        <h2 className="text-3xl font-bold mb-2">Let's get prepped.</h2>
                                        <p className="text-muted-foreground">Do you have everything ready?</p>
                                    </div>

                                    <Button
                                        onClick={addToGroceries}
                                        disabled={allIngredientsChecked}
                                        variant="outline"
                                        className={cn(
                                            "w-full h-12 rounded-xl border-2 font-semibold transition-all",
                                            allIngredientsChecked ? "opacity-50" : "border-primary/20 hover:bg-primary/5 hover:border-primary/50 text-foreground"
                                        )}
                                    >
                                        <Plus size={18} weight="bold" className="mr-2" />
                                        Add to Groceries
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto -mx-6 px-6 pb-24">
                                    <div className="space-y-3 pb-8">
                                        {recipe.ingredients.map((ingredient, index) => {
                                            // Simple fuzzy match for quantity at start of string
                                            // Matches: 1, 1/2, 1.5, 1-2, 1 cup, 1/2 tsp, etc.
                                            // Captures the quantity part vs the rest
                                            const quantityMatch = ingredient.match(/^(\d+(?:\/\d+)?(?:\.\d+)?(?:\s*-\s*\d+(?:\/\d+)?(?:\.\d+)?)?(?:\s*(?:cup|tbsp|tablespoon|teaspoon|tsp|oz|g|kg|ml|l|lb|clove|slice|piece|pinch|dash|bunch|can)s?)?\.?)\s+(.+)$/i)

                                            let quantity = quantityMatch ? quantityMatch[1] : null
                                            const name = quantityMatch ? quantityMatch[2] : ingredient

                                            // Abbreviate units
                                            if (quantity) {
                                                quantity = quantity
                                                    .replace(/tablespoons?/gi, 'tbs')
                                                    .replace(/tbsp?/gi, 'tbs') // normalize tbsp -> tbs
                                                    .replace(/teaspoons?/gi, 'tsp')
                                            }

                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => toggleIngredient(index)}
                                                    className={cn(
                                                        "w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left group",
                                                        checkedIngredients.has(index)
                                                            ? "border-primary/20 bg-primary/5"
                                                            : "border-muted hover:border-primary/50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                                        checkedIngredients.has(index)
                                                            ? "bg-primary border-primary text-primary-foreground"
                                                            : "border-muted-foreground group-hover:border-primary"
                                                    )}>
                                                        {checkedIngredients.has(index) && <Check size={14} weight="bold" />}
                                                    </div>

                                                    <div className={cn(
                                                        "flex-1 flex flex-row items-center gap-2 transition-opacity flex-wrap",
                                                        checkedIngredients.has(index) ? "opacity-50" : "opacity-100"
                                                    )}>
                                                        {quantity && (
                                                            <Badge variant="secondary" className="px-2 py-0 h-6 text-xs font-bold uppercase tracking-wide bg-muted border-primary/20 text-primary shrink-0">
                                                                {quantity}
                                                            </Badge>
                                                        )}
                                                        <span className={cn(
                                                            "text-lg leading-tight font-medium",
                                                            checkedIngredients.has(index) ? "line-through" : ""
                                                        )}>
                                                            {name}
                                                        </span>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Fixed Bottom Navigation for Prep */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pb-[calc(env(safe-area-inset-bottom)+24px)]">
                                    <div className="flex gap-4">
                                        <Button
                                            variant="outline"
                                            className="h-14 flex-1 rounded-2xl text-lg font-bold border-2"
                                            onClick={onClose}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            className="h-14 flex-[2] rounded-2xl text-lg font-bold shadow-lg"
                                            onClick={startCooking}
                                        >
                                            Next
                                            <ArrowRight size={20} weight="bold" className="ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* COOK STAGE */}
                        {stage === 'cook' && (
                            <motion.div
                                key="cook"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col"
                            >
                                {/* Media / Visualization */}
                                <div className="h-[35vh] bg-muted relative shrink-0">
                                    {recipe.imageUrl ? (
                                        <img
                                            src={recipe.imageUrl}
                                            alt="Step visualization"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-accent/10">
                                            <ChefHat size={64} className="text-muted-foreground/20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="rounded-full bg-white/80 backdrop-blur-md shadow-sm border-0"
                                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                                        >
                                            {voiceEnabled ? <SpeakerHigh size={20} weight="fill" /> : <SpeakerSlash size={20} />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Instruction Card */}
                                <div className="flex-1 bg-background -mt-6 rounded-t-3xl relative flex flex-col shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] overflow-hidden">
                                    <div className="p-8 pb-0 flex-shrink-0">
                                        <div className="flex items-center justify-between mb-6">
                                            <Badge variant="outline" className="text-sm px-3 py-1">
                                                Step {currentStep + 1} of {recipe.instructions.length}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto px-8 pb-24">
                                        <p className="text-2xl sm:text-3xl leading-snug font-medium">
                                            {(() => {
                                                const text = recipe.instructions[currentStep];
                                                // Function to parse text and replace measurements with Badges
                                                const parts = text.split(/(\d+(?:\/\d+)?(?:\.\d+)?(?:\s*-\s*\d+(?:\/\d+)?(?:\.\d+)?)?\s*(?:cups?|tbsp?|tablespoons?|teaspoons?|tsp?|oz|ounces?|grams?|g|kg|ml|l|lbs?|cloves?|slices?|pieces?|pinch(?:es)?|dash(?:es)?|bunch(?:es)?|cans?))/i);

                                                return parts.map((part, i) => {
                                                    // Check if part matches a measurement pattern
                                                    const isMeasurement = /^(\d+(?:\/\d+)?(?:\.\d+)?(?:\s*-\s*\d+(?:\/\d+)?(?:\.\d+)?)?\s*(?:cups?|tbsp?|tablespoons?|teaspoons?|tsp?|oz|ounces?|grams?|g|kg|ml|l|lbs?|cloves?|slices?|pieces?|pinch(?:es)?|dash(?:es)?|bunch(?:es)?|cans?))$/i.test(part);

                                                    if (isMeasurement) {
                                                        // Abbreviate logic
                                                        const abbreviated = part
                                                            .replace(/tablespoons?/gi, 'tbs')
                                                            .replace(/tbsp?/gi, 'tbs')
                                                            .replace(/teaspoons?/gi, 'tsp')
                                                            .replace(/cups?/gi, 'cup') // standardized singular

                                                        return (
                                                            <Badge key={i} variant="secondary" className="mx-1 px-2 py-0.5 text-lg font-bold uppercase tracking-wide bg-muted border-primary/20 text-primary align-middle">
                                                                {abbreviated}
                                                            </Badge>
                                                        );
                                                    }
                                                    return <span key={i}>{part}</span>;
                                                });
                                            })()}
                                        </p>
                                    </div>

                                    {/* Fixed Bottom Navigation for Cook */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pb-[calc(env(safe-area-inset-bottom)+24px)]">
                                        <div className="flex gap-4">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-16 w-16 rounded-full shrink-0 border-2"
                                                onClick={prevStep}
                                            >
                                                <ArrowLeft size={24} weight="bold" />
                                            </Button>
                                            <Button
                                                className="h-16 flex-1 rounded-full text-xl font-bold shadow-lg"
                                                onClick={nextStep}
                                            >
                                                {currentStep === recipe.instructions.length - 1 ? 'Finish' : 'Next Step'}
                                                <ArrowRight size={24} weight="bold" className="ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* COMPLETE STAGE */}
                        {stage === 'complete' && (
                            <motion.div
                                key="complete"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full flex flex-col items-center justify-center p-8 text-center"
                            >
                                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                                    <CheckCircle size={48} weight="fill" className="text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-4xl font-bold mb-4">Bon Appétit!</h2>
                                <p className="text-xl text-muted-foreground mb-12">
                                    You absolutely crushed it. Time to show off your masterpiece?
                                </p>

                                <div className="w-full max-w-sm space-y-4">
                                    <Button
                                        size="lg"
                                        className="w-full h-16 text-lg rounded-full font-bold gap-3"
                                        onClick={() => onComplete(true)}
                                    >
                                        <Camera size={24} weight="fill" />
                                        Capture Feast
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-full h-16 text-lg rounded-full font-medium border-2"
                                        onClick={() => onComplete(false)}
                                    >
                                        Skip & Finish
                                    </Button>

                                    <p className="text-sm text-muted-foreground pt-4">
                                        We'll remind you to rate this dish in 1 hour!
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
