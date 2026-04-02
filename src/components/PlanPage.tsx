import { useState } from 'react'
import { Planner } from '@/components/Planner'
import { ShoppingList } from '@/components/ShoppingList'
import { Recipe } from '@/lib/types'
import { CalendarBlank, ShoppingCart, ArrowLeft } from '@phosphor-icons/react'

export type PlanViewMode = 'landing' | 'planner' | 'groceries'

interface PlanPageProps {
    recipes: Recipe[]
    addMealDialogOpen: boolean
    setAddMealDialogOpen: (open: boolean) => void
    onImportFromRecipes: () => void
    viewMode: PlanViewMode
    setViewMode: (mode: PlanViewMode) => void
}

export function PlanPage({ recipes, addMealDialogOpen, setAddMealDialogOpen, onImportFromRecipes, viewMode, setViewMode }: PlanPageProps) {

    // Landing page with two cards
    if (viewMode === 'landing') {
        // Mock streak data - replace with actual user data later
        const weekStreak: number = 3 // weeks of continuous meal prepping

        return (
            <>
                {/* Plan Header */}
                <div className="pt-[calc(env(safe-area-inset-top)+24px)] pb-2 px-4 flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Plan</h1>

                    {/* Streak Pill */}
                    <div className="bg-primary/10 px-4 py-2 rounded-full flex items-center gap-2">
                        <span className="text-2xl">🔥</span>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-primary">{weekStreak} Week{weekStreak !== 1 ? 's' : ''}</span>
                            <span className="text-xs text-muted-foreground">Meal Prep Streak</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] gap-6 px-4">
                    {/* Meal Prep Card */}
                    <button
                        onClick={() => setViewMode('planner')}
                        className="w-full bg-card hover:bg-primary/5 border-2 border-border hover:border-primary transition-all rounded-2xl p-8 text-center group"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <CalendarBlank size={40} weight="bold" className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Meal Prep</h2>
                                <p className="text-muted-foreground">Plan your weekly meals</p>
                            </div>
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <span>View Calendar</span>
                                <span className="text-xl">→</span>
                            </div>
                        </div>
                    </button>

                    {/* Groceries Card */}
                    <button
                        onClick={() => setViewMode('groceries')}
                        className="w-full bg-card hover:bg-primary/5 border-2 border-border hover:border-primary transition-all rounded-2xl p-8 text-center group"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <ShoppingCart size={40} weight="bold" className="text-primary" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Groceries</h2>
                                <p className="text-muted-foreground">Manage your shopping list</p>
                            </div>
                            <div className="flex items-center gap-2 text-primary font-medium">
                                <span>View List</span>
                                <span className="text-xl">→</span>
                            </div>
                        </div>
                    </button>
                </div>
            </>
        )
    }

    // Expanded Planner view
    if (viewMode === 'planner') {
        return (
            <div className="h-full flex flex-col">
                {/* Back button */}
                <div className="pt-[calc(env(safe-area-inset-top)+12px)] pb-3 px-4 border-b border-border bg-background">
                    <button
                        onClick={() => setViewMode('landing')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={20} weight="bold" />
                        <span>Back to Plan</span>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden">
                    <Planner
                        recipes={recipes}
                        addMealDialogOpen={addMealDialogOpen}
                        setAddMealDialogOpen={setAddMealDialogOpen}
                    />
                </div>
            </div>
        )
    }

    // Expanded Groceries view
    return (
        <div className="h-full flex flex-col">
            {/* Back button */}
            <div className="pt-[calc(env(safe-area-inset-top)+12px)] pb-3 px-4 border-b border-border bg-background">
                <button
                    onClick={() => setViewMode('landing')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft size={20} weight="bold" />
                    <span>Back to Plan</span>
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                <ShoppingList onImportFromRecipes={onImportFromRecipes} />
            </div>
        </div>
    )
}
