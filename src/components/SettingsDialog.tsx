import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PencilSimple, Check, X } from '@phosphor-icons/react'
import { useUserProfile } from '@/hooks/use-user-profile'
import { toast } from 'sonner'

const FOOD_PREFERENCES = [
    'Italian', 'Mexican', 'Chinese', 'Indian', 'Japanese', 'Thai',
    'Mediterranean', 'French', 'Korean', 'Vietnamese', 'Middle Eastern',
    'Greek', 'Spanish', 'American', 'Comfort Food', 'Healthy',
    'Quick & Easy', 'Vegetarian', 'Vegan', 'BBQ', 'Baking', 'Desserts'
]

interface SettingsDialogProps {
    open: boolean
    onClose: () => void
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
    const { profile, updateProfile } = useUserProfile()
    const familyCookName = profile.familyCookName || ''
    const foodPreferences = profile.foodPreferences || []

    const [isEditingName, setIsEditingName] = useState(false)
    const [editedName, setEditedName] = useState('')

    // Preferences editing state is always "active" in this dialog effectively, 
    // or we can just iterate directly on the profile methods if we want instant save,
    // but better to have local state and save on specific actions or debounce?
    // Profile.tsx had "Edit" mode.
    // Let's simplified it: Toggle prefs immediately updates? Or local state?
    // Profile.tsx used "Edit -> Save". I'll replicate that for consistency and safety.

    const [editedPreferences, setEditedPreferences] = useState<string[]>(foodPreferences)
    const [isDirtyPrefs, setIsDirtyPrefs] = useState(false)
    const [customPref, setCustomPref] = useState('')

    // Reset local state when dialog opens
    // We can use a useEffect or just rely on the user interactions. 
    // Ideally we sync with profile when opening.
    // For simplicity, we'll initialize from profile when the "Edit" button for prefs is clicked?
    // Or just show current prefs and have an "Edit" button.

    // Name Handlers
    const handleEditNameClick = () => {
        setEditedName(familyCookName)
        setIsEditingName(true)
    }

    const handleSaveName = async () => {
        if (editedName.trim()) {
            try {
                await updateProfile({ familyCookName: editedName.trim() })
                setIsEditingName(false)
                toast.success('Cook name updated')
            } catch (error) {
                toast.error('Failed to update name')
            }
        }
    }

    // Prefs Handlers
    const handleTogglePreference = (pref: string) => {
        // Optimistic UI? Or local state?
        // Let's use local state + explicit Save button for prefs section
        const newPrefs = editedPreferences.includes(pref)
            ? editedPreferences.filter(p => p !== pref)
            : [...editedPreferences, pref]
        setEditedPreferences(newPrefs)
        setIsDirtyPrefs(true)
    }

    const handleSavePreferences = async () => {
        try {
            const customPrefixes = customPref.trim()
                ? customPref.split(',').map(p => p.trim()).filter(p => p.length > 0)
                : []
            const finalPrefs = [...new Set([...editedPreferences, ...customPrefixes])]

            await updateProfile({ foodPreferences: finalPrefs })
            setIsDirtyPrefs(false)
            setCustomPref('')
            toast.success('Preferences updated')
        } catch (error) {
            toast.error('Failed to update preferences')
        }
    }

    // Sync state when profile loads/dialog opens
    if (!open && isDirtyPrefs) {
        setIsDirtyPrefs(false) // Reset on close if unsaved?
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Profile Settings</DialogTitle>
                    <DialogDescription>
                        Update your chef profile and food preferences.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-6 py-4">
                        {/* Name Section */}
                        <div className="space-y-3">
                            <Label>Family Cook Name</Label>
                            {isEditingName ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        placeholder="Enter name"
                                    />
                                    <Button size="icon" onClick={handleSaveName}>
                                        <Check size={18} />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)}>
                                        <X size={18} />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                    <span className="font-medium">{familyCookName || 'Not Set'}</span>
                                    <Button size="icon" variant="ghost" onClick={handleEditNameClick}>
                                        <PencilSimple size={18} />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Preferences Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Food Preferences</Label>
                                {isDirtyPrefs && (
                                    <Button size="sm" onClick={handleSavePreferences}>
                                        Save Changes
                                    </Button>
                                )}
                            </div>

                            {/* Selected Prefs Display / Edit Area */}
                            <div className="flex flex-wrap gap-2">
                                {FOOD_PREFERENCES.map(pref => {
                                    const isSelected = isDirtyPrefs
                                        ? editedPreferences.includes(pref)
                                        : foodPreferences?.includes(pref)

                                    // If we are not in "dirty" state, clicking should start editing?
                                    // Let's just make it always editable but require Save.
                                    // So we initialize editedPreferences with profile.foodPreferences on mount.
                                    // But hook execution order issues.
                                    // Let's simpler: Just always use editedPreferences, initialized from profile if not dirty.
                                    return (
                                        <Badge
                                            key={pref}
                                            variant={isSelected ? "default" : "outline"}
                                            className="cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => {
                                                if (!isDirtyPrefs) {
                                                    // First edit, sync logic
                                                    setEditedPreferences(
                                                        foodPreferences?.includes(pref)
                                                            ? foodPreferences.filter(p => p !== pref)
                                                            : [...(foodPreferences || []), pref]
                                                    )
                                                    setIsDirtyPrefs(true)
                                                } else {
                                                    handleTogglePreference(pref)
                                                }
                                            }}
                                        >
                                            {pref}
                                        </Badge>
                                    )
                                })}
                            </div>

                            <div className="pt-2">
                                <Label className="text-xs text-muted-foreground mb-1.5 block">Add Custom (comma separated)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={customPref}
                                        onChange={(e) => {
                                            setCustomPref(e.target.value)
                                            if (!isDirtyPrefs) {
                                                setEditedPreferences(foodPreferences || [])
                                                setIsDirtyPrefs(true)
                                            }
                                        }}
                                        placeholder="e.g. Gluten-Free, Keto"
                                        className="h-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
                <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full" onClick={onClose}>
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
