import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, X, Image as ImageIcon } from '@phosphor-icons/react'
import { Recipe, RecipeCategory, RecipeFormData } from '@/lib/types'
import { toast } from 'sonner'

interface RecipeDialogProps {
  open: boolean
  onClose: () => void
  onSave: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'userId'>) => void
  recipe?: Recipe
}

const categories: RecipeCategory[] = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Drinks']

export function RecipeDialog({ open, onClose, onSave, recipe }: RecipeDialogProps) {
  const [formData, setFormData] = useState<RecipeFormData>({
    name: '',
    description: '',
    category: 'Dinner',
    prepTime: '',
    cookTime: '',
    servings: '',
    ingredients: [''],
    instructions: [''],
    imageUrl: undefined
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name,
        description: recipe.description,
        category: recipe.category,
        prepTime: recipe.prepTime.toString(),
        cookTime: recipe.cookTime.toString(),
        servings: recipe.servings.toString(),
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        imageUrl: recipe.imageUrl
      })
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'Dinner',
        prepTime: '',
        cookTime: '',
        servings: '',
        ingredients: [''],
        instructions: [''],
        imageUrl: undefined
      })
    }
  }, [recipe, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const ingredients = formData.ingredients.filter(i => i.trim() !== '')
    const instructions = formData.instructions.filter(i => i.trim() !== '')

    if (!formData.name.trim()) {
      toast.error('Please enter a recipe name')
      return
    }

    if (ingredients.length === 0) {
      toast.error('Please add at least one ingredient')
      return
    }

    if (instructions.length === 0) {
      toast.error('Please add at least one instruction')
      return
    }

    const prepTime = parseInt(formData.prepTime) || 0
    const cookTime = parseInt(formData.cookTime) || 0
    const servings = parseInt(formData.servings) || 1

    onSave({
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
      prepTime,
      cookTime,
      servings,
      ingredients,
      instructions,
      imageUrl: formData.imageUrl
    })

    onClose()
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setFormData(prev => ({ ...prev, imageUrl: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, imageUrl: undefined }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }))
  }

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }))
  }

  const updateIngredient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }))
  }

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }))
  }

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }))
  }

  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {recipe ? 'Edit Recipe' : 'Add New Recipe'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Recipe Photo (Optional)</Label>
                {formData.imageUrl ? (
                  <div className="relative">
                    <div className="rounded-lg overflow-hidden border-2 border-border">
                      <img
                        src={formData.imageUrl}
                        alt="Recipe preview"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleImageRemove}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" weight="bold" />
                      Choose Photo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Add a photo to your recipe (optional)
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Recipe Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Chocolate Chip Cookies"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="A brief description of your recipe..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as RecipeCategory }))}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    min="1"
                    value={formData.servings}
                    onChange={(e) => setFormData(prev => ({ ...prev, servings: e.target.value }))}
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prep-time">Prep Time (min)</Label>
                  <Input
                    id="prep-time"
                    type="number"
                    min="0"
                    value={formData.prepTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, prepTime: e.target.value }))}
                    placeholder="15"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cook-time">Cook Time (min)</Label>
                  <Input
                    id="cook-time"
                    type="number"
                    min="0"
                    value={formData.cookTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, cookTime: e.target.value }))}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Ingredients *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addIngredient}
                  >
                    <Plus size={16} weight="bold" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value)}
                        placeholder="2 cups all-purpose flour"
                      />
                      {formData.ingredients.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIngredient(index)}
                        >
                          <X size={18} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Instructions *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addInstruction}
                  >
                    <Plus size={16} weight="bold" />
                    Add Step
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold mt-2">
                        {index + 1}
                      </div>
                      <Textarea
                        value={instruction}
                        onChange={(e) => updateInstruction(index, e.target.value)}
                        placeholder="Describe this step..."
                        rows={2}
                      />
                      {formData.instructions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInstruction(index)}
                        >
                          <X size={18} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            {recipe ? 'Save Changes' : 'Add Recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
