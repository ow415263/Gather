import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
    Plus, X, CreditCard, Star, Trash, ArrowLeft,
    Camera, Barcode, DotsThreeVertical, CheckCircle
} from '@phosphor-icons/react'
import { useLoyaltyCards } from '@/hooks/use-loyalty-cards'
import { LoyaltyCard } from '@/lib/types'
import { ShoppingList } from '@/components/ShoppingList'
import { ImportFromRecipesDialog } from '@/components/ImportFromRecipesDialog'
import { useRecipes } from '@/hooks/use-recipes'
import { useShoppingList } from '@/hooks/use-shopping-list'

// ─── Fullscreen Card Viewer ───────────────────────────────────────────────────
function CardViewer({ card, onClose }: { card: LoyaltyCard; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
            onClick={onClose}
        >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-4">
                <button
                    onClick={onClose}
                    className="text-white/70 hover:text-white transition-colors"
                >
                    <ArrowLeft size={26} weight="bold" />
                </button>
                <p className="text-white font-semibold text-lg">{card.storeName}</p>
                <div className="w-7" />
            </div>

            {/* Card Image — landscape, full brightness for barcode scanning */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05 }}
                className="w-full max-w-lg px-6"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={card.cardImageUrl}
                    alt={card.storeName}
                    className="w-full rounded-2xl shadow-2xl object-contain"
                    style={{ filter: 'brightness(1.1) contrast(1.05)' }}
                />
                <p className="text-white/50 text-center text-sm mt-6">
                    Tap anywhere to close
                </p>
            </motion.div>
        </motion.div>
    )
}

// ─── Add Card Sheet ────────────────────────────────────────────────────────────
function AddCardSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, imageUrl: string) => Promise<void> }) {
    const [storeName, setStoreName] = useState('')
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => setImagePreview(ev.target?.result as string)
        reader.readAsDataURL(file)
    }

    const handleSave = async () => {
        if (!storeName.trim()) { toast.error('Give your card a store name'); return }
        if (!imagePreview) { toast.error('Take a photo of your card first'); return }
        setSaving(true)
        try {
            await onAdd(storeName.trim(), imagePreview)
            toast.success(`${storeName} card added to your wallet 🎉`)
            onClose()
        } catch (e: any) {
            toast.error(`Couldn't save card: ${e.message}`)
        } finally {
            setSaving(false)
        }
    }

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl border-t border-border"
        >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-6 pb-10 pt-2 space-y-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Add a card</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={22} />
                    </button>
                </div>

                {/* Store Name */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Store name</label>
                    <input
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="e.g. PC Optimum, Scene+, Moi"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        autoFocus
                    />
                </div>

                {/* Image Area */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Card photo</label>
                    {imagePreview ? (
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="Card preview"
                                className="w-full h-44 object-cover rounded-xl border border-border"
                            />
                            <button
                                onClick={() => setImagePreview(null)}
                                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-44 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col items-center justify-center gap-3 text-muted-foreground"
                        >
                            <Camera size={36} weight="duotone" className="text-primary/60" />
                            <div className="text-center">
                                <p className="text-sm font-medium">Photograph your card</p>
                                <p className="text-xs text-muted-foreground/70 mt-0.5">Lay it flat, capture the full card</p>
                            </div>
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageCapture}
                        className="hidden"
                    />
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving || !storeName.trim() || !imagePreview}
                    className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {saving ? 'Saving...' : 'Save to wallet'}
                </button>
            </div>
        </motion.div>
    )
}

// ─── Card Tile ─────────────────────────────────────────────────────────────────
function CardTile({ card, onTap, onDelete, onSetPrimary }: {
    card: LoyaltyCard
    onTap: () => void
    onDelete: () => void
    onSetPrimary: () => void
}) {
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative"
        >
            <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={onTap}
                className="cursor-pointer"
            >
                {/* Card Image */}
                <div className="relative rounded-2xl overflow-hidden shadow-md border border-border/40">
                    <img
                        src={card.cardImageUrl}
                        alt={card.storeName}
                        className="w-full h-28 object-cover"
                    />
                    {/* Gradient overlay for name */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Primary badge */}
                    {card.isPrimary && (
                        <div className="absolute top-2 left-2">
                            <span className="flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <Star size={10} weight="fill" /> Primary
                            </span>
                        </div>
                    )}

                    {/* Scan icon */}
                    <Barcode size={18} className="absolute top-2 right-8 text-white/70" />

                    {/* Store name */}
                    <p className="absolute bottom-2 left-3 text-white text-xs font-semibold drop-shadow">
                        {card.storeName}
                    </p>
                </div>
            </motion.div>

            {/* Menu button */}
            <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
                className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1 text-white/80 hover:text-white"
            >
                <DotsThreeVertical size={16} weight="bold" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -4 }}
                            className="absolute top-10 right-2 z-20 bg-background border border-border rounded-xl shadow-xl overflow-hidden min-w-[160px]"
                        >
                            {!card.isPrimary && (
                                <button
                                    onClick={() => { onSetPrimary(); setMenuOpen(false) }}
                                    className="flex items-center gap-2.5 w-full px-4 py-3 text-sm hover:bg-muted text-left"
                                >
                                    <CheckCircle size={16} className="text-primary" />
                                    Set as primary
                                </button>
                            )}
                            <button
                                onClick={() => { onDelete(); setMenuOpen(false) }}
                                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm hover:bg-muted text-left text-destructive"
                            >
                                <Trash size={16} />
                                Remove card
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// ─── Wallet Sheet ────────────────────────────────────────────────────────────
function WalletSheet({
    onClose,
    onAddCard,
    cards,
    loading,
    handleDelete,
    setPrimary,
    setViewingCard
}: {
    onClose: () => void
    onAddCard: () => void
    cards: LoyaltyCard[]
    loading: boolean
    handleDelete: (card: LoyaltyCard) => void
    setPrimary: (id: string) => void
    setViewingCard: (card: LoyaltyCard) => void
}) {
    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-40 bg-background rounded-t-3xl shadow-2xl border-t border-border flex flex-col h-[85vh]"
        >
            {/* Handle */}
            <div className="flex-none flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="flex-none px-6 pt-2 pb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <CreditCard size={22} className="text-primary" weight="duotone" />
                        Your Wallet
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Reward & loyalty cards</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:text-foreground">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-12">
                {loading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[0, 1].map(i => (
                            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center space-y-4">
                        <CreditCard size={48} weight="duotone" className="text-muted-foreground/30" />
                        <div>
                            <p className="text-base font-medium">No cards yet</p>
                            <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">Add your grocery reward cards to scan at checkout</p>
                        </div>
                        <button
                            onClick={onAddCard}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all active:scale-[0.97]"
                        >
                            <Plus size={16} weight="bold" />
                            Add a card
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                            <AnimatePresence mode="popLayout">
                                {cards.map(card => (
                                    <CardTile
                                        key={card.id}
                                        card={card}
                                        onTap={() => setViewingCard(card)}
                                        onDelete={() => handleDelete(card)}
                                        onSetPrimary={() => setPrimary(card.id)}
                                    />
                                ))}
                                {cards.length < 10 && (
                                    <motion.button
                                        key="add-more"
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={onAddCard}
                                        className="h-28 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/10 hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-1 text-muted-foreground"
                                    >
                                        <Plus size={22} className="text-primary/50" />
                                        <span className="text-xs font-medium">Add card</span>
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                        <p className="text-xs text-center text-muted-foreground/50">
                            Tap a card to open it for scanning at checkout
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

// ─── Main GatherPage ───────────────────────────────────────────────────────────
type GatherView = 'main' | 'addCard' | 'wallet' | 'importing'

export function GatherPage() {
    const { cards, loading, addCard, deleteCard, setPrimary } = useLoyaltyCards()
    const { recipes } = useRecipes()
    const { addItems } = useShoppingList()

    const [view, setView] = useState<GatherView>('main')
    const [viewingCard, setViewingCard] = useState<LoyaltyCard | null>(null)

    const handleDelete = useCallback(async (card: LoyaltyCard) => {
        try {
            await deleteCard(card)
            toast.success(`${card.storeName} removed`)
        } catch (e: any) {
            toast.error('Could not remove card')
        }
    }, [deleteCard])

    return (
        <div className="min-h-screen bg-background pb-24 flex flex-col">
            {/* ── Header ── */}
            <div className="flex-none pt-[calc(env(safe-area-inset-top)+24px)] px-5 pb-4 bg-background border-b border-border/60">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <div>
                        <h1 className="text-3xl font-bold">Shop</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Your shopping cart</p>
                    </div>
                    <button
                        onClick={() => setView('wallet')}
                        className="w-11 h-11 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors relative"
                    >
                        <CreditCard size={22} className="text-foreground" weight="duotone" />
                        {cards.length > 0 && (
                            <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                        )}
                    </button>
                </div>
            </div>

            {/* ── Main Content (Shopping List takes full space) ── */}
            <div className="flex-1 w-full max-w-lg mx-auto overflow-hidden flex flex-col items-stretch">
                <ShoppingList onImportFromRecipes={() => setView('importing')} />
            </div>

            {/* ── Overlays ── */}
            <AnimatePresence>
                {/* Wallet Overlay */}
                {view === 'wallet' && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-30 bg-black"
                            onClick={() => setView('main')}
                        />
                        <WalletSheet
                            onClose={() => setView('main')}
                            onAddCard={() => setView('addCard')}
                            cards={cards}
                            loading={loading}
                            handleDelete={handleDelete}
                            setPrimary={setPrimary}
                            setViewingCard={setViewingCard}
                        />
                    </>
                )}

                {/* Add Card Overlay */}
                {view === 'addCard' && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black"
                            onClick={() => setView(cards.length > 0 ? 'wallet' : 'main')}
                        />
                        <div className="fixed inset-x-0 bottom-0 z-50">
                            <AddCardSheet
                                onClose={() => setView(cards.length > 0 ? 'wallet' : 'main')}
                                onAdd={addCard}
                            />
                        </div>
                    </>
                )}

                {/* Import Dialog */}
                <ImportFromRecipesDialog
                    open={view === 'importing'}
                    onClose={() => setView('main')}
                    recipes={recipes}
                    onAddToShoppingList={async (ingredients) => {
                        try {
                            await addItems(ingredients)
                            setView('main')
                        } catch (error) {
                            console.error('Failed to add ingredients:', error)
                        }
                    }}
                />

                {/* Card Viewer Overlay */}
                {viewingCard && (
                    <CardViewer
                        card={viewingCard}
                        onClose={() => setViewingCard(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

