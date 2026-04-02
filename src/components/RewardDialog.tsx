import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trophy, ShareNetwork, X, Star } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import JSConfetti from 'js-confetti'
import { useEffect } from 'react'

interface RewardDialogProps {
    open: boolean
    onClose: () => void
    level: number
    xpGained: number
    unlockedArtifactName?: string
    onShare: () => void
}

export function RewardDialog({ open, onClose, level, xpGained, unlockedArtifactName, onShare }: RewardDialogProps) {

    useEffect(() => {
        if (open) {
            const jsConfetti = new JSConfetti()
            jsConfetti.addConfetti({
                emojis: ['🏆', '✨', '👨‍🍳', '🔥'],
                confettiNumber: 100,
            })
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md border-2 border-primary/20 bg-background/95 backdrop-blur-xl">
                <div className="flex flex-col items-center text-center p-6 space-y-6">
                    <div className="relative">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", duration: 0.8 }}
                            className="w-24 h-24 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-lg"
                        >
                            <Trophy size={48} weight="fill" className="text-white" />
                        </motion.div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full border-2 border-background"
                        >
                            +{xpGained} XP
                        </motion.div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                            Level Up!
                        </h2>
                        <p className="text-muted-foreground">
                            You are now a <strong>Level {level} Chef</strong>.
                        </p>
                        {unlockedArtifactName && (
                            <div className="mt-4 p-3 bg-secondary/50 rounded-xl border border-secondary">
                                <p className="text-sm font-medium flex items-center justify-center gap-2">
                                    <Star weight="fill" className="text-yellow-500" />
                                    New Artifact Unlocked:
                                </p>
                                <p className="text-lg font-bold text-foreground">{unlockedArtifactName}</p>
                            </div>
                        )}
                    </div>

                    <div className="w-full space-y-3 pt-4">
                        <Button
                            className="w-full h-12 text-lg rounded-xl font-bold gap-2"
                            onClick={onShare}
                        >
                            <ShareNetwork size={20} weight="bold" />
                            Share with Friends
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground"
                            onClick={onClose}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    )
}
