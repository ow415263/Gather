import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { X, Image as ImageIcon, Camera, FolderOpen } from '@phosphor-icons/react'
import { Recipe, ExtractedRecipeData } from '@/lib/types'
import { extractRecipeFromImageClient } from '@/api/client'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface PhotoRecipeDialogProps {
  open: boolean
  onClose: () => void
  onSave: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'userId'>) => void
}

export function PhotoRecipeDialog({ open, onClose, onSave }: PhotoRecipeDialogProps) {
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
      // Compress image before setting and extracting if it's large
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
      console.log('[Client] Starting extraction with image URL length:', imageDataUrl.length)

      const extracted = await extractRecipeFromImageClient(imageDataUrl, currentUserId, idToken)
      console.log('[Client] Extraction successful:', extracted)

      // Update state with newly generated AI image if available
      if (extracted.imageUrl) {
        console.log('[Client] Setting AI Generated Image URL:', extracted.imageUrl)
        setImageUrl(extracted.imageUrl)
      }

      setExtractedData(extracted)
      toast.success('Recipe extracted successfully with AI image!')
    } catch (err: any) {
      console.error('[Client] Extraction error:', err)
      console.error('[Client] Error details:', err.message)
      toast.error(err.message || 'Failed to extract recipe from image')
      setExtractedData(null)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleImageRemove = () => {
    setImageUrl(undefined)
    setExtractedData(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
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
        imageUrl: extractedData.imageUrl || imageUrl // Favor the backend generated image
      })
      handleClose()
    } catch (error) {
      console.error('[PhotoRecipeDialog] Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setImageUrl(undefined)
    setExtractedData(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Add Recipe from Photo (Beta)
          </DialogTitle>
          <DialogDescription>
            Upload a recipe image and let AI capture the ingredients and steps for you.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <div className="space-y-6">
            {!imageUrl ? (
              // Upload Phase
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a photo of your recipe (handwritten or printed) and we'll extract the details for you.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {/* Camera */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    className="h-24 flex flex-col items-center justify-center"
                  >
                    <Camera size={24} weight="bold" className="mb-2" />
                    <span className="text-xs">Camera</span>
                  </Button>
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

                  {/* File Upload */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-24 flex flex-col items-center justify-center"
                  >
                    <FolderOpen size={24} weight="bold" className="mb-2" />
                    <span className="text-xs">Files</span>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    id="photo-file-input"
                    name="photo-file-input"
                    className="hidden"
                  />

                  {/* Drag & Drop Info */}
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="h-24 flex flex-col items-center justify-center"
                  >
                    <ImageIcon size={24} weight="bold" className="mb-2" />
                    <span className="text-xs">Drag photo</span>
                  </Button>
                </div>
              </div>
            ) : isExtracting ? (
              // Extracting Phase
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="animate-spin">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Extracting recipe data from your photo...
                </p>
              </div>
            ) : extractedData ? (
              // Results Phase
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border-2 border-border">
                  <img
                    src={extractedData.imageUrl || imageUrl}
                    alt="Recipe preview"
                    className="w-full h-40 object-cover"
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
            ) : null}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          {imageUrl && (
            <Button
              variant="outline"
              onClick={handleImageRemove}
            >
              <X className="w-4 h-4 mr-2" />
              {extractedData ? 'Try Another' : 'Cancel'}
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
          {!imageUrl && (
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
