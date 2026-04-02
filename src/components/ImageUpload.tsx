import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Image as ImageIcon, X, Sparkle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onImageSelect: (imageDataUrl: string, fileType: string) => void
  onImageRemove: () => void
  currentImage?: string
  disabled?: boolean
  isProcessing?: boolean
}

export function ImageUpload({ 
  onImageSelect, 
  onImageRemove, 
  currentImage,
  disabled = false,
  isProcessing = false
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Check file size (max 20MB for OCR)
    if (file.size > 20 * 1024 * 1024) {
      alert('Image size must be less than 20MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      onImageSelect(reader.result as string, file.type)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('Image size must be less than 20MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      onImageSelect(reader.result as string, file.type)
    }
    reader.readAsDataURL(file)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  if (currentImage) {
    return (
      <div className="relative">
        <div className="relative rounded-lg overflow-hidden border-2 border-border">
          <img 
            src={currentImage} 
            alt="Recipe preview" 
            className="w-full h-64 object-cover"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <Sparkle className="w-8 h-8 mx-auto mb-2 animate-spin" weight="fill" />
                <p className="text-sm font-medium">Extracting recipe data...</p>
              </div>
            </div>
          )}
        </div>
        {!disabled && !isProcessing && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={onImageRemove}
          >
            <X className="w-4 h-4 mr-1" />
            Remove
          </Button>
        )}
      </div>
    )
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <Camera className="w-8 h-8 text-muted-foreground" />
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-1">
              Upload Recipe Photo
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Take a photo or upload an image of a recipe page
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Text will be automatically extracted from the image
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleButtonClick}
              disabled={disabled}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Or drag and drop an image here
          </p>
        </div>
      </div>
    </div>
  )
}
