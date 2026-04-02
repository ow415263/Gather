import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    MagicWand, CaretDown, List, Plus, Minus, ForkKnife, Users,
    Camera, Link, Microphone, PaperPlaneTilt
} from '@phosphor-icons/react'
import { RecipeView } from './RecipeView'
import { useUserProfile } from '@/hooks/use-user-profile'
import { useGenerateRecipe } from '@/hooks/use-generate-recipe'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { ScanView } from './ScanView'
import { ManualEntryView } from './ManualEntryView'
import { useRecipes } from '@/hooks/use-recipes'
import { Recipe } from '@/lib/types'
import { getCategoryImage } from '@/lib/categoryImages'


interface CookDialogProps {
    open: boolean
    onClose: () => void
    onOpenExtract: (method: 'manual' | 'photo' | 'link') => void
    onGenerate?: (recipe: any) => void
}

type SubView = 'none' | 'photo' | 'manual'

export function CookDialog({ open, onClose, onOpenExtract, onGenerate }: CookDialogProps) {
    const [prompt, setPrompt] = useState('')
    const [numCourses, setNumCourses] = useState(1)
    const [numServings, setNumServings] = useState(2)
    const [generatedRecipe, setGeneratedRecipe] = useState<any | null>(null)
    const [subView, setSubView] = useState<SubView>('none')
    const [popoverOpen, setPopoverOpen] = useState(false)


    const { profile } = useUserProfile()
    const { generate, isGenerating } = useGenerateRecipe()
    const { addRecipe, recipes } = useRecipes()

    const liveRecipe = generatedRecipe?.id
        ? recipes.find(r => r.id === generatedRecipe.id) || generatedRecipe
        : generatedRecipe

    const handleClose = () => {
        onClose()
        setTimeout(() => {
            setPrompt('')
            setNumCourses(1)
            setNumServings(2)
            setGeneratedRecipe(null)
            setSubView('none')
        }, 300)
    }

    const handleGenerate = async () => {
        if (!prompt.trim()) return

        try {
            const hour = new Date().getHours()
            let defaultCategory = 'Dinner'
            if (hour >= 5 && hour < 11) defaultCategory = 'Breakfast'
            else if (hour >= 11 && hour < 16) defaultCategory = 'Lunch'

            const initialImage = getCategoryImage(defaultCategory as any)

            setGeneratedRecipe({
                id: 'generating',
                name: 'Thinking...',
                description: 'Chef is reviewing your request...',
                imageUrl: initialImage,
                ingredients: [],
                instructions: [],
                courses: [],
                prepTime: 0,
                cookTime: 0,
                servings: numServings,
                rating: 0,
                category: defaultCategory
            })

            const recipeFn = await generate(
                prompt,
                profile,
                undefined,
                [],
                numCourses,
                numServings,
                (partial) => {
                    setGeneratedRecipe((prev: any) => {
                        const newState = {
                            ...prev,
                            ...partial,
                            ingredients: Array.isArray(partial.ingredients) ? partial.ingredients : (prev?.ingredients || []),
                            instructions: Array.isArray(partial.instructions) ? partial.instructions : (prev?.instructions || []),
                            courses: Array.isArray(partial.courses) ? partial.courses : (prev?.courses || []),
                            servings: partial.servings || prev?.servings || numServings,
                            prepTime: partial.prepTime || prev?.prepTime || 0,
                            cookTime: partial.cookTime || prev?.cookTime || 0,
                            id: 'generating'
                        }
                        if (!partial.category) {
                            newState.category = prev?.category || defaultCategory
                        }
                        if (!newState.imageUrl) {
                            newState.imageUrl = initialImage
                        }
                        return newState
                    })
                },
                initialImage
            )

            if (recipeFn) {
                const safeRecipe = {
                    ...recipeFn,
                    ingredients: Array.isArray(recipeFn.ingredients) ? recipeFn.ingredients : [],
                    instructions: Array.isArray(recipeFn.instructions) ? recipeFn.instructions : [],
                    courses: Array.isArray(recipeFn.courses) ? recipeFn.courses : []
                }
                setGeneratedRecipe(safeRecipe)
            }
        } catch (error) {
            setGeneratedRecipe(null)
        }
    }

    const handleSaveNewRecipe = async (recipeData: Omit<Recipe, 'id' | 'createdAt'>) => {
        try {
            const newId = await addRecipe(recipeData)
            toast.success('Recipe saved!')
            const fullRecipe = {
                ...recipeData,
                id: newId,
                createdAt: new Date()
            }
            setGeneratedRecipe(fullRecipe)
            setSubView('none')
        } catch (error) {
            console.error('Failed to save recipe:', error)
            toast.error('Failed to save recipe')
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        handleGenerate()
    }

    return (
        <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="!fixed !inset-0 !z-50 !max-w-none !w-screen !h-[100dvh] !translate-x-0 !translate-y-0 !border-none !bg-white !p-0 !m-0 !shadow-none !outline-none !rounded-none overflow-hidden block">
                <DialogTitle className="sr-only">Cook</DialogTitle>

                {/* Sub-views (Photo/Manual) overlay */}
                {subView === 'photo' && (
                    <div className="absolute inset-0 z-50 bg-background animate-in fade-in duration-200">
                        <ScanView
                            onSave={handleSaveNewRecipe}
                            onCancel={() => setSubView('none')}
                        />
                    </div>
                )}
                {subView === 'manual' && (
                    <div className="absolute inset-0 z-50 bg-background animate-in fade-in duration-200">
                        <ManualEntryView
                            onSave={handleSaveNewRecipe}
                            onCancel={() => setSubView('none')}
                        />
                    </div>
                )}

                {/* Generated Recipe overlay */}
                {generatedRecipe && (
                    <div className="absolute inset-0 z-40 bg-background animate-in fade-in duration-200">
                        <div className="flex flex-col h-full">
                            {/* Recipe header */}
                            <div className="flex-none flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-3">
                                <button
                                    onClick={() => setGeneratedRecipe(null)}
                                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <CaretDown size={18} className="rotate-90" />
                                    Back
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                                >
                                    <CaretDown size={20} weight="bold" className="text-gray-400" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 pb-32">
                                <div className="max-w-2xl mx-auto space-y-6">
                                    <div className="bg-muted/30 px-4 py-3 rounded-xl flex items-center gap-3">
                                        <MagicWand size={18} className="text-primary" weight="fill" />
                                        <p className="text-sm text-muted-foreground italic line-clamp-1">
                                            "{prompt}"
                                        </p>
                                    </div>
                                    <RecipeView
                                        recipe={liveRecipe}
                                        onCook={() => {
                                            onGenerate && onGenerate(liveRecipe)
                                            handleClose()
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Cook Screen — flex column, gradient covers everything */}
                <div
                    className="flex flex-col h-full w-full bg-white"
                    style={{
                        background: 'linear-gradient(180deg, rgba(255,170,155,0.4) 0%, rgba(255,190,165,0.3) 20%, rgba(255,210,190,0.2) 40%, rgba(255,230,215,0.1) 60%, white 80%)',
                    }}
                >
                    {/* Top Bar — fixed height, transparent over gradient */}
                    <div className="flex-none flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-2">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
                            <List size={24} weight="bold" className="text-gray-400" />
                        </button>
                        <button
                            onClick={handleClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                        >
                            <CaretDown size={24} weight="bold" className="text-gray-400" />
                        </button>
                    </div>

                    {/* Content — fills remaining space, scrollable, content pushed to bottom */}
                    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-end items-center px-8 pb-4">
                        {/* Spacer with floating food icons to push content toward bottom when there's room */}
                        <div className="flex-1 relative w-full max-w-sm min-h-[150px] my-4 pointer-events-none">
                            {[
                                { emoji: '🍕', top: '10%', left: '15%', duration: 4 },
                                { emoji: '🥑', top: '15%', left: '75%', duration: 5 },
                                { emoji: '🍔', top: '50%', left: '10%', duration: 4.5 },
                                { emoji: '🥗', top: '45%', left: '80%', duration: 4 },
                                { emoji: '🌮', top: '85%', left: '20%', duration: 5.5 },
                                { emoji: '🍣', top: '80%', left: '75%', duration: 4 },
                                { emoji: '🍜', top: '35%', left: '45%', duration: 6 },
                            ].map((icon, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute text-4xl opacity-80 mix-blend-multiply flex items-center justify-center"
                                    initial={{ 
                                        top: '50%', 
                                        left: '50%', 
                                        scale: 0,
                                        x: '-50%',
                                        y: '-50%'
                                    }}
                                    animate={{ 
                                        top: icon.top, 
                                        left: icon.left,
                                        scale: 1,
                                        x: '-50%',
                                        y: '-50%'
                                    }}
                                    transition={{
                                        type: 'spring', 
                                        damping: 14, 
                                        stiffness: 100, 
                                        delay: i * 0.05 + 0.2
                                    }}
                                >
                                    <motion.div
                                        animate={{ 
                                            y: [0, -15, 0],
                                            rotate: [0, -10, 10, -10, 0]
                                        }}
                                        transition={{
                                            duration: icon.duration,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: i * 0.05 + 0.8
                                        }}
                                    >
                                        {icon.emoji}
                                    </motion.div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Heading */}
                        <h1 className="text-xl font-bold text-gray-800 text-center mb-6 flex-shrink-0">
                            What are you craving today?
                        </h1>

                        {/* Meal Settings */}
                        <div className="w-full max-w-sm space-y-5 flex-shrink-0">
                            {/* Courses Slider */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-400 font-medium">Courses</span>
                                    <span className="text-sm font-bold text-gray-800">
                                        {numCourses === 1 ? 'Single Dish' : `${numCourses} Course Meal`}
                                    </span>
                                </div>
                                <Slider
                                    value={[numCourses]}
                                    onValueChange={(vals) => setNumCourses(vals[0])}
                                    max={5}
                                    min={1}
                                    step={1}
                                    className="py-1"
                                />
                            </div>

                            {/* Servings Counter */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400 font-medium">Servings</span>
                                <div className="flex items-center gap-3 border border-gray-200 rounded-full px-1 py-1">
                                    <button
                                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                                        onClick={() => setNumServings(Math.max(1, numServings - 1))}
                                    >
                                        <Minus size={14} weight="bold" className="text-gray-500" />
                                    </button>
                                    <span className="font-bold text-gray-800 w-6 text-center">{numServings}</span>
                                    <button
                                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                                        onClick={() => setNumServings(Math.min(20, numServings + 1))}
                                    >
                                        <Plus size={14} weight="bold" className="text-gray-500" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Input Bar — fixed height, stays at bottom */}
                    <div className="flex-none px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] bg-white/80 backdrop-blur-sm border-t border-gray-100">
                        <form onSubmit={handleSubmit} className="flex items-center gap-2">
                            {/* + Button */}
                            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
                                    >
                                        <Plus size={20} weight="bold" className="text-gray-400" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-48 p-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPopoverOpen(false)
                                            setSubView('photo')
                                        }}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                        <Camera size={20} />
                                        Scan Photo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPopoverOpen(false)
                                            toast.info('Link import coming soon!')
                                        }}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                        <Link size={20} />
                                        Import Link
                                    </button>
                                </PopoverContent>
                            </Popover>

                            {/* Text Input */}
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="What's for lunch?"
                                    disabled={isGenerating}
                                    className="w-full h-11 rounded-full border border-gray-200 bg-gray-50 px-4 pr-12 text-base placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-colors"
                                />
                                {prompt.trim() && (
                                    <button
                                        type="submit"
                                        disabled={isGenerating}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                                    >
                                        <PaperPlaneTilt size={16} weight="fill" className="text-white" />
                                    </button>
                                )}
                            </div>

                            {/* Voice Button */}
                            <button
                                type="button"
                                onClick={() => toast.info('Voice input coming soon!')}
                                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors flex-shrink-0"
                            >
                                <Microphone size={20} weight="fill" className="text-primary" />
                            </button>
                        </form>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    )
}
