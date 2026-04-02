import { useState } from 'react'
import { Plus, CaretLeft, CaretRight, Trash, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Recipe } from '@/lib/types'
import { usePlanner, MealPlanItem } from '@/hooks/use-planner'
import { toast } from 'sonner'

interface MealSlot {
  id: string
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'side-dish' | 'appetizer' | 'other'
  recipe?: Recipe
  customName?: string
}

interface DayPlan {
  date: Date
  meals: MealSlot[]
}

interface PlannerProps {
  recipes: Recipe[]
  addMealDialogOpen: boolean
  setAddMealDialogOpen: (open: boolean) => void
}

export function Planner({ recipes, addMealDialogOpen, setAddMealDialogOpen }: PlannerProps) {
  const { mealPlanItems, addMeal, deleteMeal } = usePlanner(recipes)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedMealType, setSelectedMealType] = useState<MealPlanItem['type']>('breakfast')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  // Get the first day of the month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  // Get the day of week for the first day (0 = Sunday)
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Calculate days to show from previous month
  const daysInMonth = lastDayOfMonth.getDate()
  const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate()

  // Generate calendar days
  const calendarDays: (Date | null)[] = []

  // Previous month days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthLastDay - i)
    )
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
  }

  // Next month days to fill the grid
  const remainingDays = 42 - calendarDays.length // 6 rows * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i))
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const getMealsForDate = (date: Date): MealPlanItem[] => {
    const key = formatDateKey(date)
    return mealPlanItems.filter(item => formatDateKey(new Date(item.date)) === key)
  }

  const handleAddMeal = async () => {
    if (!selectedDate || !selectedRecipe) return

    try {
      await addMeal(selectedDate, selectedMealType, selectedRecipe.id)
      setAddMealDialogOpen(false)
      setSelectedRecipe(null)
      setSelectedMealType('breakfast')
      toast.success('Meal added to plan')
    } catch (error) {
      toast.error('Failed to add meal')
    }
  }

  const handleDeleteMeal = async (e: React.MouseEvent, mealId: string) => {
    e.stopPropagation()
    try {
      await deleteMeal(mealId)
      toast.success('Meal removed from plan')
    } catch (error) {
      toast.error('Failed to remove meal')
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setAddMealDialogOpen(true)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const mealTypeLabels = {
    'breakfast': 'Breakfast',
    'lunch': 'Lunch',
    'dinner': 'Dinner',
    'snack': 'Snack',
    'side-dish': 'Side Dish',
    'appetizer': 'Appetizer',
    'other': 'Other'
  }

  return (
    <>
      <div className="h-[calc(100vh-11rem)] md:h-[calc(100vh-7rem)] w-full flex flex-col md:px-0">
        {/* Calendar Grid */}
        <div className="bg-card overflow-hidden flex-1 flex flex-col w-full">
          {/* Month header with navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/50">
            <Button onClick={goToPreviousMonth} variant="ghost" size="icon">
              <CaretLeft size={20} />
            </Button>
            <h2 className="text-2xl font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button onClick={goToNextMonth} variant="ghost" size="icon">
              <CaretRight size={20} />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border flex-shrink-0">
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted/50"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 flex-1 grid-rows-6">
            {calendarDays.map((date, index) => {
              if (!date) return null
              const meals = getMealsForDate(date)
              const isTodayDate = isToday(date)
              const isCurrentMonthDate = isCurrentMonth(date)

              return (
                <div
                  key={index}
                  className={`p-2 border-b border-r border-border ${!isCurrentMonthDate ? 'bg-muted/30' : ''
                    } ${isTodayDate ? 'bg-[#AA624D] text-white' : ''} hover:bg-muted/50 transition-colors cursor-pointer overflow-y-auto`}
                  onClick={() => handleDateClick(date)}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${!isCurrentMonthDate ? 'text-muted-foreground' : ''
                      } ${isTodayDate ? 'text-white font-bold' : ''}`}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {meals.slice(0, 3).map((meal) => (
                      <div
                        key={meal.id}
                        className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded truncate flex items-center justify-between group ${isTodayDate ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                          }`}
                      >
                        <span className="truncate flex-1">{meal.recipe?.name || meal.customName}</span>
                        <button
                          onClick={(e) => handleDeleteMeal(e, meal.id)}
                          className="opacity-0 group-hover:opacity-100 hover:text-destructive flex-shrink-0 ml-1"
                        >
                          <X size={10} weight="bold" />
                        </button>
                      </div>
                    ))}
                    {meals.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1.5">
                        +{meals.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Add Meal Dialog */}
        <Dialog open={addMealDialogOpen} onOpenChange={setAddMealDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Add Meal {selectedDate && `- ${selectedDate.toLocaleDateString()}`}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Meal Type Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Meal Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(mealTypeLabels).map(([type, label]) => (
                    <button
                      key={type}
                      onClick={() => setSelectedMealType(type as MealPlanItem['type'])}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedMealType === type
                        ? 'bg-[#AA624D] text-white'
                        : 'bg-secondary text-secondary-foreground'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipe Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Recipe</label>
                <div className="grid gap-2 max-h-96 overflow-y-auto">
                  {recipes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No recipes available. Create a recipe first!
                    </p>
                  ) : (
                    recipes.map(recipe => (
                      <button
                        key={recipe.id}
                        onClick={() => setSelectedRecipe(recipe)}
                        className={`p-4 rounded-lg border text-left transition-colors ${selectedRecipe?.id === recipe.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                      >
                        <div className="font-semibold">{recipe.name}</div>
                        {recipe.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {recipe.description}
                          </div>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {recipe.category && (
                            <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                              {recipe.category}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {recipe.prepTime + recipe.cookTime} min
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setAddMealDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMeal} disabled={!selectedRecipe}>
                  Add Meal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
