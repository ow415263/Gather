import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, ArrowRight, Check, X } from '@phosphor-icons/react'
import { useTribeProfile } from '@/hooks/use-tribe-profile'
import { useUserProfile } from '@/hooks/use-user-profile'

interface Props {
    onComplete: () => void
    onSkip: () => void
}

type Step = 'opt-in' | 'photo-wild' | 'photo-chef' | 'done'

const FOOD_PREFS = [
    'Italian', 'Asian', 'Mexican', 'Indian', 'BBQ', 'Baking',
    'Vegetarian', 'Vegan', 'Mediterranean', 'Healthy', 'Comfort Food', 'Street Food',
]

function PhotoUploadSlot({
    label, hint, file, onChange,
}: {
    label: string
    hint: string
    file: File | null
    onChange: (f: File) => void
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const preview = file ? URL.createObjectURL(file) : null

    return (
        <div className="space-y-3">
            <div>
                <p className="font-semibold text-base">{label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{hint}</p>
            </div>
            <button
                onClick={() => inputRef.current?.click()}
                className={`w-full aspect-[4/5] rounded-3xl overflow-hidden border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${preview ? 'border-transparent' : 'border-border hover:border-primary/50 bg-muted/40'
                    }`}
            >
                {preview ? (
                    <img src={preview} alt="" className="w-full h-full object-cover object-top" />
                ) : (
                    <>
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <Camera size={28} className="text-primary" weight="duotone" />
                        </div>
                        <span className="text-sm text-muted-foreground">Tap to add photo</span>
                    </>
                )}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={e => e.target.files?.[0] && onChange(e.target.files[0])}
            />
        </div>
    )
}

export function TribeOnboarding({ onComplete, onSkip }: Props) {
    const [step, setStep] = useState<Step>('opt-in')
    const [wildPhoto, setWildPhoto] = useState<File | null>(null)
    const [chefPhoto, setChefPhoto] = useState<File | null>(null)
    const [selectedPrefs, setSelectedPrefs] = useState<string[]>([])
    const [saving, setSaving] = useState(false)
    const { uploadPhoto, saveProfile } = useTribeProfile()
    const { profile: userProfile } = useUserProfile()

    const togglePref = (p: string) => {
        setSelectedPrefs(prev =>
            prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p].slice(0, 5)
        )
    }

    const handleFinish = async () => {
        if (!wildPhoto && !chefPhoto) { onComplete(); return }
        setSaving(true)
        try {
            const urls: string[] = []
            if (wildPhoto) urls.push(await uploadPhoto(wildPhoto, 0))
            if (chefPhoto) urls.push(await uploadPhoto(chefPhoto, 1))

            await saveProfile({
                displayName: userProfile.familyCookName || 'Forager',
                photoUrls: urls,
                rank: 'Scout',
                foodPreferences: selectedPrefs,
                recipesCooked: userProfile.stats?.recipesCount || 0,
                isDiscoverable: true,
                createdAt: Date.now(),
            })
            setStep('done')
        } catch (err: any) {
            console.error(err)
            alert(`Failed to save profile: ${err.message}`)
            setSaving(false)
        }
    }

    const canProceedToFinish = wildPhoto !== null || chefPhoto !== null

    const stepIndex = { 'opt-in': 0, 'photo-wild': 1, 'photo-chef': 2, 'done': 3 }[step]

    return (
        <div className="fixed inset-0 z-[60] bg-background flex flex-col">
            {/* Progress dots */}
            {step !== 'opt-in' && step !== 'done' && (
                <div className="absolute top-[calc(env(safe-area-inset-top)+12px)] left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {[1, 2].map(i => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${stepIndex >= i ? 'w-8 bg-primary' : 'w-4 bg-border'
                                }`}
                        />
                    ))}
                </div>
            )}

            <AnimatePresence mode="wait">
                {/* ── Step 1: Opt-in ── */}
                {step === 'opt-in' && (
                    <motion.div
                        key="opt-in"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6"
                    >
                        <div className="text-6xl">👨‍🍳</div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold">Want to meet fellow chefs?</h1>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Set up a public profile and discover cooks in your area. Share what you make, connect with people who cook like you.
                            </p>
                        </div>
                        <div className="w-full space-y-3">
                            <button
                                onClick={() => setStep('photo-wild')}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2"
                            >
                                Let's do it <ArrowRight size={18} />
                            </button>
                            <button
                                onClick={onSkip}
                                className="w-full text-muted-foreground py-3 text-sm"
                            >
                                Maybe later
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── Step 2: Wild photo ── */}
                {step === 'photo-wild' && (
                    <motion.div
                        key="photo-wild"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        className="flex-1 flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+52px)] pb-8 gap-6"
                    >
                        <PhotoUploadSlot
                            label="Show us you out in the wild 🌲"
                            hint="A photo of you foraging, at a market, in nature — anything you love"
                            file={wildPhoto}
                            onChange={setWildPhoto}
                        />

                        <div className="mt-auto space-y-3">
                            <button
                                onClick={() => setStep('photo-chef')}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                Next <ArrowRight size={18} />
                            </button>
                            <button onClick={() => setStep('photo-chef')} className="w-full text-muted-foreground py-2 text-sm">
                                Skip this one
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── Step 3: Chef photo + prefs ── */}
                {step === 'photo-chef' && (
                    <motion.div
                        key="photo-chef"
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        className="flex-1 flex flex-col px-5 pt-[calc(env(safe-area-inset-top)+52px)] pb-8 overflow-y-auto gap-5"
                    >
                        <PhotoUploadSlot
                            label="Now show us you cheffin it up 🍳"
                            hint="In your kitchen, at the grill, plating a dish — your element"
                            file={chefPhoto}
                            onChange={setChefPhoto}
                        />

                        <div>
                            <p className="font-semibold text-base mb-1">Your food preferences</p>
                            <p className="text-sm text-muted-foreground mb-3">Pick up to 5</p>
                            <div className="flex flex-wrap gap-2">
                                {FOOD_PREFS.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => togglePref(p)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${selectedPrefs.includes(p)
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-muted border-border text-muted-foreground'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto space-y-3">
                            <button
                                onClick={handleFinish}
                                disabled={saving || !canProceedToFinish}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                {saving ? 'Saving…' : <>Join the Tribe <ArrowRight size={18} /></>}
                            </button>
                            {!canProceedToFinish && (
                                <p className="text-center text-xs text-muted-foreground">Add at least one photo to continue</p>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ── Step 4: Done ── */}
                {step === 'done' && (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="w-20 h-20 rounded-full bg-primary flex items-center justify-center"
                        >
                            <Check size={40} weight="bold" className="text-primary-foreground" />
                        </motion.div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold">You're in the Tribe 🔥</h1>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Your profile is live. Start discovering chefs near you.
                            </p>
                        </div>
                        <button
                            onClick={onComplete}
                            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-semibold"
                        >
                            Start Exploring
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Close */}
            {step !== 'done' && (
                <button
                    onClick={onSkip}
                    className="absolute top-[calc(env(safe-area-inset-top)+10px)] right-5 w-9 h-9 rounded-full bg-muted flex items-center justify-center"
                >
                    <X size={18} weight="bold" />
                </button>
            )}
        </div>
    )
}
