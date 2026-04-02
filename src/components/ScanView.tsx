import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { X, Camera, FolderOpen, CaretDown } from '@phosphor-icons/react'
import { Recipe, ExtractedRecipeData } from '@/lib/types'
import { extractRecipeFromImageClient } from '@/api/client'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface ScanViewProps {
    onSave: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'userId'>) => void
    onCancel: () => void
}

export function ScanView({ onSave, onCancel }: ScanViewProps) {
    const [imageUrl, setImageUrl] = useState<string | undefined>()
    const [isExtracting, setIsExtracting] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [extractedData, setExtractedData] = useState<ExtractedRecipeData | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const { currentUser } = useAuth()

    const compressImage = (dataUrl: string, maxWidth = 1200, quality = 0.7): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width)
                    width = maxWidth
                }
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx?.drawImage(img, 0, 0, width, height)
                resolve(canvas.toDataURL('image/jpeg', quality))
            }
            img.src = dataUrl
        })
    }

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }
        const reader = new FileReader()
        reader.onload = async () => {
            const rawDataUrl = reader.result as string
            const processedDataUrl = rawDataUrl.length > 500000
                ? await compressImage(rawDataUrl)
                : rawDataUrl
            setImageUrl(processedDataUrl)
            setExtractedData(null)
            extractRecipe(processedDataUrl)
        }
        reader.readAsDataURL(file)
    }

    const extractRecipe = async (imageDataUrl: string) => {
        try {
            const currentUserId = currentUser?.uid
            const idToken = await currentUser?.getIdToken()
            if (!currentUserId) {
                toast.error('You must be signed in to extract recipes')
                return
            }
            setIsExtracting(true)
            const extracted = await extractRecipeFromImageClient(imageDataUrl, currentUserId, idToken)
            if (extracted.imageUrl) {
                setImageUrl(extracted.imageUrl)
            }
            setExtractedData(extracted)
            toast.success('Recipe extracted successfully!')
        } catch (err: any) {
            console.error('[Client] Extraction error:', err)
            toast.error(err.message || 'Failed to extract recipe from image')
            setExtractedData(null)
        } finally {
            setIsExtracting(false)
        }
    }

    const handleImageRemove = () => {
        setImageUrl(undefined)
        setExtractedData(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (cameraInputRef.current) cameraInputRef.current.value = ''
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
                imageUrl: extractedData.imageUrl || imageUrl
            })
        } catch (error) {
            console.error('[PhotoRecipeDialog] Save error:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Top Bar with Back Button */}
            <div className="flex-none flex items-center px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-2">
                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <CaretDown size={18} className="rotate-90" />
                    Back
                </button>
            </div>

            {/* Content */}
            {!imageUrl ? (
                /* Upload Phase — centered */
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                    <Camera size={48} weight="light" className="text-gray-300 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Scan a Recipe</h2>
                    <p className="text-sm text-gray-400 text-center mb-8 max-w-xs">
                        Take a photo or upload an image of a recipe and we'll extract it for you.
                    </p>

                    <div className="flex gap-4 w-full max-w-xs">
                        {/* Camera */}
                        <button
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                            <Camera size={28} weight="bold" className="text-primary" />
                            <span className="text-sm font-medium text-gray-600">Camera</span>
                        </button>
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageSelect}
                            id="photo-camera-input"
                            name="photo-camera-input"
                            className="hidden"
                        />

                        {/* Files */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                            <FolderOpen size={28} weight="bold" className="text-primary" />
                            <span className="text-sm font-medium text-gray-600">Files</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            id="photo-file-input"
                            name="photo-file-input"
                            className="hidden"
                        />
                    </div>
                </div>
            ) : isExtracting ? (
                /* Extracting Phase — centered */
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="animate-spin mb-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-400">Extracting recipe data...</p>
                </div>
            ) : extractedData ? (
                /* Results Phase — scrollable */
                <>
                    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4">
                        <div className="space-y-4 max-w-2xl mx-auto">
                            <div className="rounded-lg overflow-hidden border-2 border-border">
                                <img
                                    src={extractedData.imageUrl || imageUrl}
                                    alt="Recipe preview"
                                    className="w-full h-48 object-cover"
                                />
                            </div>

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
                                <div className="mt-2 space-y-1 text-sm bg-muted/20 p-3 rounded-lg">
                                    {extractedData.ingredients.map((ing, idx) => (
                                        <p key={idx} className="text-muted-foreground">• {ing}</p>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground">Instructions ({extractedData.instructions.length})</Label>
                                <div className="mt-2 space-y-2 text-sm bg-muted/20 p-3 rounded-lg">
                                    {extractedData.instructions.map((inst, idx) => (
                                        <p key={idx} className="text-muted-foreground flex gap-2">
                                            <span className="font-medium text-primary shrink-0">{idx + 1}.</span>
                                            <span>{inst}</span>
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex-none p-4 bg-white border-t border-gray-100 pb-[calc(env(safe-area-inset-bottom)+12px)]">
                        <div className="flex gap-2 max-w-2xl mx-auto">
                            <Button variant="outline" onClick={handleImageRemove} className="flex-1">
                                <X className="w-4 h-4 mr-2" />
                                Try Another
                            </Button>
                            <Button onClick={handleSaveRecipe} disabled={isSaving} className="flex-1">
                                {isSaving ? 'Saving...' : 'Save Recipe'}
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-gray-400">Processing...</p>
                </div>
            )}
        </div>
    )
}
