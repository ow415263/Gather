import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, ThumbsUp } from '@phosphor-icons/react'
import { Switch } from '@/components/ui/switch'

interface ReviewDialogProps {
    open: boolean
    onClose: () => void
    onSubmit: (rating: number, text: string, isPublic: boolean) => void
    isSubmitting?: boolean
}

export function ReviewDialog({ open, onClose, onSubmit, isSubmitting = false, recipeName }: ReviewDialogProps & { recipeName?: string }) {
    const [rating, setRating] = useState(0)
    const [text, setText] = useState('')
    const [isPublic, setIsPublic] = useState(true)

    const handleSubmit = () => {
        if (rating === 0) return
        onSubmit(rating, text, isPublic)
        onClose()
    }

    const handleClose = () => {
        setRating(0)
        setText('')
        setIsPublic(true)
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Rate {recipeName || '& Review'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-2">
                        <Label>How was it?</Label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="hover:scale-110 transition-transform focus:outline-none"
                                >
                                    <Star
                                        size={32}
                                        weight={star <= rating ? "fill" : "regular"}
                                        className={star <= rating ? "text-orange-400" : "text-muted-foreground/30"}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground h-5">
                            {rating === 1 && "Needs improvement"}
                            {rating === 2 && "It was okay"}
                            {rating === 3 && "Good"}
                            {rating === 4 && "Great!"}
                            {rating === 5 && "Amazing!"}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="review">Write a review (optional)</Label>
                        <Textarea
                            id="review"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="What did you like? Any tips?"
                            rows={4}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2 border rounded-lg p-3">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="public-mode" className="font-medium">Public Review</Label>
                            <span className="text-xs text-muted-foreground">
                                Help others find this recipe
                            </span>
                        </div>
                        <Switch
                            id="public-mode"
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
