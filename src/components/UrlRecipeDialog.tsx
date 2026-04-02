import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { X, Link } from '@phosphor-icons/react'
import { Recipe, ExtractedRecipeData } from '@/lib/types'
import { extractRecipeFromUrlClient } from '@/api/client'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface UrlRecipeDialogProps {
    open: boolean
    onClose: () => void
    onSave: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'userId'>) => void
    initialUrl?: string | null
    autoSave?: boolean
}

export function UrlRecipeDialog({ open, onClose, onSave, initialUrl, autoSave }: UrlRecipeDialogProps) {
    const [url, setUrl] = useState('')
    const [isExtracting, setIsExtracting] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [extractedData, setExtractedData] = useState<ExtractedRecipeData | null>(null)
    const { currentUser } = useAuth()

    // Auto-fill and extract if initialUrl is provided
    useEffect(() => {
        if (open && initialUrl && !extractedData && !isExtracting) {
            setUrl(initialUrl)
            handleExtract(initialUrl)
        } else if (open && !initialUrl) {
            // Reset if opened without URL
            if (!extractedData) setUrl('')
        }
    }, [open, initialUrl])

    const handleExtract = async (urlOverride?: string) => {
        const targetUrl = urlOverride || url
        if (!targetUrl.trim()) {
            toast.error('Please enter a recipe URL')
            return
        }

        // Basic URL validation
        try {
            new URL(targetUrl)
        } catch {
            toast.error('Please enter a valid URL')
            return
        }

        try {
            const currentUserId = currentUser?.uid
            const idToken = await currentUser?.getIdToken()

            if (!currentUserId) {
                toast.error('You must be signed in to extract recipes')
                return
            }

            setIsExtracting(true)
            console.log('[Client] Starting URL extraction for:', targetUrl)

            const extracted = await extractRecipeFromUrlClient(targetUrl, currentUserId, idToken)
            console.log('[Client] Extraction successful:', extracted)

            setExtractedData(extracted)
            toast.success('Recipe extracted successfully!')

            // Auto-Save Trigger
            if (open && initialUrl && autoSave) {
                // We need to trigger save, but state updates might be async. 
                // We can call save directly here with the data we just got.
                setIsSaving(true)
                await onSave({
                    name: extracted.name,
                    description: extracted.description,
                    category: extracted.category,
                    prepTime: extracted.prepTime,
                    cookTime: extracted.cookTime,
                    servings: extracted.servings,
                    ingredients: extracted.ingredients,
                    instructions: extracted.instructions,
                    imageUrl: extracted.imageUrl
                })
                handleClose()
                setIsSaving(false)
            }

        } catch (err: any) {
            console.error('[Client] URL Extraction error:', err)
            toast.error(err.message || 'Failed to extract recipe from URL')
            setExtractedData(null)
            setIsSaving(false)
        } finally {
            setIsExtracting(false)
        }
    }

    const handleSaveRecipe = async () => {
        if (!extractedData) {
            toast.error('No recipe data to save')
            return
        }

        try {
            setIsSaving(true)
            await onSave({
                name: extractedData.name,
                description: extractedData.description,
                category: extractedData.category,
                prepTime: extractedData.prepTime,
                cookTime: extractedData.cookTime,
                servings: extractedData.servings,
                ingredients: extractedData.ingredients,
                instructions: extractedData.instructions,
                imageUrl: extractedData.imageUrl
            })
            handleClose()
        } catch (error) {
            console.error('[UrlRecipeDialog] Save error:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleClose = () => {
        setUrl('')
        setExtractedData(null)
        onClose()
    }

    const handleTryAnother = () => {
        setUrl('')
        setExtractedData(null)
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">
                        Import Recipe from URL
                    </DialogTitle>
                    <DialogDescription>
                        Paste a recipe URL from any website and let AI extract the recipe for you.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
                    <div className="space-y-6">
                        {!extractedData ? (
                            // Input Phase
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Enter a URL from AllRecipes, NYT Cooking, or any recipe website.
                                </p>

                                <div className="space-y-2">
                                    <Label htmlFor="recipe-url">Recipe URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="recipe-url"
                                            type="url"
                                            placeholder="https://www.allrecipes.com/recipe/..."
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                                            disabled={isExtracting}
                                        />
                                        <Button
                                            onClick={() => handleExtract()}
                                            disabled={isExtracting || !url.trim()}
                                        >
                                            <Link className="w-4 h-4 mr-2" weight="bold" />
                                            {isExtracting ? 'Extracting...' : 'Extract'}
                                        </Button>
                                    </div>
                                </div>

                                {isExtracting && (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                        <div className="animate-spin">
                                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Fetching and extracting recipe data...
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Results Phase
                            <div className="space-y-4">
                                {extractedData.imageUrl && (
                                    <div className="rounded-lg overflow-hidden border-2 border-border">
                                        <img
                                            src={extractedData.imageUrl}
                                            alt="Recipe preview"
                                            className="w-full h-40 object-cover"
                                        />
                                    </div>
                                )}

                                <Card className="p-4 space-y-3">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Recipe Name</Label>
                                        <p className="text-lg font-semibold">{extractedData.name}</p>
                                    </div>

                                    {extractedData.description && (
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Description</Label>
                                            <p className="text-sm">{extractedData.description}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Category</Label>
                                            <p className="font-medium">{extractedData.category}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Servings</Label>
                                            <p className="font-medium">{extractedData.servings}</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Prep Time</Label>
                                            <p className="font-medium">{extractedData.prepTime} min</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Cook Time</Label>
                                            <p className="font-medium">{extractedData.cookTime} min</p>
                                        </div>
                                    </div>
                                </Card>

                                <div>
                                    <Label className="text-xs text-muted-foreground">Ingredients ({extractedData.ingredients.length})</Label>
                                    <div className="mt-2 space-y-1 text-sm">
                                        {extractedData.ingredients.map((ing, idx) => (
                                            <p key={idx} className="text-muted-foreground">• {ing}</p>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">Instructions ({extractedData.instructions.length})</Label>
                                    <div className="mt-2 space-y-2 text-sm">
                                        {extractedData.instructions.map((inst, idx) => (
                                            <p key={idx} className="text-muted-foreground">
                                                <span className="font-medium mr-2">{idx + 1}.</span>{inst}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="gap-2">
                    {extractedData && (
                        <Button
                            variant="outline"
                            onClick={handleTryAnother}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Try Another
                        </Button>
                    )}
                    {extractedData && (
                        <Button
                            onClick={handleSaveRecipe}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                'Save Recipe'
                            )}
                        </Button>
                    )}
                    {!extractedData && !isExtracting && (
                        <Button
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
