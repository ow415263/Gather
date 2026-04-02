import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PencilSimple, Camera, Link, MagicWand, X } from '@phosphor-icons/react'

interface AddRecipeMethodDialogProps {
  open: boolean
  onClose: () => void
  onSelectMethod: (method: 'manual' | 'photo' | 'link' | 'prompt') => void
}

export function AddRecipeMethodDialog({
  open,
  onClose,
  onSelectMethod
}: AddRecipeMethodDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-none w-screen h-screen rounded-none border-none bg-background p-0 flex flex-col [&>button]:hidden">
        <div className="flex items-start justify-between p-4 pt-[calc(env(safe-area-inset-top)+24px)] sm:p-8 gap-3">
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-left pt-2">
            How would you like to add a recipe?
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-12 w-12 hover:bg-muted shrink-0">
            <X size={24} weight="bold" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start sm:justify-center p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <Button
              variant="outline"
              className="w-full h-32 sm:h-40 flex-col gap-3 text-base sm:text-lg text-foreground hover:text-foreground active:text-foreground hover:bg-accent/10 hover:border-primary/20 active:bg-accent/10 active:border-primary/20 transition-all group"
              onClick={() => onSelectMethod('manual')}
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <PencilSimple size={28} weight="fill" className="text-blue-600 dark:text-blue-400" />
              </div>
              <span>Enter Manually</span>
            </Button>

            <Button
              variant="outline"
              className="w-full h-32 sm:h-40 flex-col gap-3 text-base sm:text-lg text-foreground hover:text-foreground active:text-foreground hover:bg-accent/10 hover:border-primary/20 active:bg-accent/10 active:border-primary/20 transition-all group"
              onClick={() => onSelectMethod('photo')}
            >
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera size={28} weight="fill" className="text-green-600 dark:text-green-400" />
              </div>
              <span>From Photo</span>
            </Button>

            <Button
              variant="outline"
              className="w-full h-32 sm:h-40 flex-col gap-3 text-base sm:text-lg text-foreground hover:text-foreground active:text-foreground hover:bg-accent/10 hover:border-primary/20 active:bg-accent/10 active:border-primary/20 transition-all group"
              onClick={() => onSelectMethod('link')}
            >
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Link size={28} weight="fill" className="text-orange-600 dark:text-orange-400" />
              </div>
              <span>From Website</span>
            </Button>

            <Button
              variant="outline"
              className="w-full h-32 sm:h-40 flex-col gap-3 text-base sm:text-lg text-foreground hover:text-foreground active:text-foreground hover:bg-accent/10 hover:border-primary/20 active:bg-accent/10 active:border-primary/20 transition-all group"
              onClick={() => onSelectMethod('prompt')}
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MagicWand size={28} weight="fill" className="text-purple-600 dark:text-purple-400" />
              </div>
              <span>Create from Prompt</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
