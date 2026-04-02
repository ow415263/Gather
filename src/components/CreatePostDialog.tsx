import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Camera, Image as ImageIcon, X, VideoCamera } from '@phosphor-icons/react'
import { Recipe } from '@/lib/types'
import { toast } from 'sonner'

interface CreatePostDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (postData: {
        recipeId?: string
        recipeName?: string
        recipeCategory?: string
        caption?: string
    }, mediaFile?: File) => Promise<void>
    recipes: Recipe[]
    preSelectedRecipe?: Recipe
}

export function CreatePostDialog({ open, onClose, onSubmit, recipes, preSelectedRecipe }: CreatePostDialogProps) {
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>(preSelectedRecipe?.id || '')
    const [caption, setCaption] = useState('')
    const [mediaFile, setMediaFile] = useState<File | null>(null)
    const [mediaPreview, setMediaPreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open && preSelectedRecipe) {
            setSelectedRecipeId(preSelectedRecipe.id)
        }
    }, [open, preSelectedRecipe])

    const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            toast.error('Please select an image or video file')
            return
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            toast.error('File size must be less than 10MB')
            return
        }

        setMediaFile(file)

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setMediaPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleRemoveMedia = () => {
        setMediaFile(null)
        setMediaPreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleSubmit = async () => {
        // Require at least a photo/video OR a caption
        if (!mediaFile && !caption.trim()) {
            toast.error('Please add a photo, video, or caption')
            return
        }

        const selectedRecipe = selectedRecipeId ? recipes.find(r => r.id === selectedRecipeId) : null

        try {
            setIsSubmitting(true)
            await onSubmit(
                {
                    recipeId: selectedRecipe?.id,
                    recipeName: selectedRecipe?.name,
                    recipeCategory: selectedRecipe?.category,
                    caption: caption.trim() || undefined
                },
                mediaFile || undefined
            )

            // Reset form
            setSelectedRecipeId(preSelectedRecipe?.id || '')
            setCaption('')
            setMediaFile(null)
            setMediaPreview(null)
            onClose()
            toast.success('Post created successfully!')
        } catch (error) {
            console.error('Error creating post:', error)
            toast.error('Failed to create post')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        if (!isSubmitting) {
            setSelectedRecipeId(preSelectedRecipe?.id || '')
            setCaption('')
            setMediaFile(null)
            setMediaPreview(null)
            onClose()
        }
    }

    const isVideo = mediaFile?.type.startsWith('video/')

    return (
        <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-none w-screen h-screen rounded-none border-none bg-background p-0 flex flex-col [&>button]:hidden">
                <div className="flex items-start justify-between p-4 pt-[calc(env(safe-area-inset-top)+24px)] sm:p-8 gap-3 border-b">
                    <DialogTitle className="text-2xl sm:text-3xl font-bold text-left pt-2">
                        Share Your Creation
                    </DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="rounded-full h-12 w-12 hover:bg-muted shrink-0"
                    >
                        <X size={24} weight="bold" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                    <div className="w-full space-y-6">
                        {/* Recipe Selection (Optional) */}
                        <div className="space-y-2">
                            <Label htmlFor="recipe">Link to Recipe (Optional)</Label>
                            <Select
                                value={selectedRecipeId}
                                onValueChange={setSelectedRecipeId}
                                disabled={!!preSelectedRecipe}
                            >
                                <SelectTrigger id="recipe">
                                    <SelectValue placeholder="No recipe linked" />
                                </SelectTrigger>
                                <SelectContent>
                                    {recipes.map(recipe => (
                                        <SelectItem key={recipe.id} value={recipe.id}>
                                            {recipe.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Media Upload */}
                        <div className="space-y-2">
                            <Label>Photo or Video</Label>
                            {mediaPreview ? (
                                <div className="relative rounded-lg overflow-hidden border-2 border-border">
                                    {isVideo ? (
                                        <video
                                            src={mediaPreview}
                                            controls
                                            className="w-full h-auto max-h-96 object-cover"
                                        />
                                    ) : (
                                        <img
                                            src={mediaPreview}
                                            alt="Preview"
                                            className="w-full h-auto max-h-96 object-cover"
                                        />
                                    )}
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2"
                                        onClick={handleRemoveMedia}
                                    >
                                        <X size={18} weight="bold" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={handleMediaSelect}
                                        className="hidden"
                                    />
                                    <Button
                                        variant="outline"
                                        className="flex-1 aspect-square flex flex-col items-center justify-center gap-2 h-auto"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <ImageIcon size={32} weight="bold" />
                                        <span>Choose File</span>
                                    </Button>
                                    {/* Camera capture - only on mobile */}
                                    <Button
                                        variant="outline"
                                        className="flex-1 aspect-square flex flex-col items-center justify-center gap-2 h-auto md:hidden"
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.setAttribute('capture', 'environment')
                                                fileInputRef.current.click()
                                            }
                                        }}
                                    >
                                        <Camera size={32} weight="bold" />
                                        <span>Camera</span>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Caption */}
                        <div className="space-y-2">
                            <Label htmlFor="caption">Caption (Optional)</Label>
                            <Textarea
                                id="caption"
                                placeholder="Share your thoughts about this dish..."
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                rows={4}
                                maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {caption.length}/500
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t p-4 sm:p-6 flex gap-3 justify-end">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Posting...' : 'Post'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
