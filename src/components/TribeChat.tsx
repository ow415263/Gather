import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, PaperPlaneTilt } from '@phosphor-icons/react'
import { useTribeChat } from '@/hooks/use-tribe-chat'
import { useAuth } from '@/contexts/AuthContext'

interface ChatProfile {
    id: string
    name: string
    photoUrl: string
}

interface Props {
    otherUser: ChatProfile
    onClose: () => void
}

export function TribeChat({ otherUser, onClose }: Props) {
    const { currentUser } = useAuth()
    const { messages, loading, sendMessage } = useTribeChat(otherUser.id)
    const [text, setText] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!text.trim()) return
        const msg = text
        setText('')
        await sendMessage(msg)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
        >
            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 border-b border-border flex-shrink-0 bg-background/90 backdrop-blur-sm">
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
                >
                    <ArrowLeft size={20} weight="bold" />
                </button>
                <img
                    src={otherUser.photoUrl}
                    alt={otherUser.name}
                    className="w-10 h-10 rounded-full object-cover object-top flex-shrink-0"
                />
                <div className="min-w-0">
                    <p className="font-semibold text-base leading-tight truncate">{otherUser.name}</p>
                    <p className="text-xs text-muted-foreground">Tribe connection</p>
                </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
                        <img
                            src={otherUser.photoUrl}
                            alt=""
                            className="w-16 h-16 rounded-full object-cover object-top border-2 border-primary"
                        />
                        <p className="font-semibold">You matched with {otherUser.name}!</p>
                        <p className="text-sm text-muted-foreground">Say something — maybe what you're cooking this week 👋</p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, i) => {
                            const isMe = msg.senderId === currentUser?.uid
                            const showAvatar = !isMe && (i === 0 || messages[i - 1].senderId !== msg.senderId)
                            return (
                                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {!isMe && (
                                        <div className="w-7 flex-shrink-0">
                                            {showAvatar && (
                                                <img
                                                    src={otherUser.photoUrl}
                                                    alt=""
                                                    className="w-7 h-7 rounded-full object-cover object-top"
                                                />
                                            )}
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                : 'bg-muted text-foreground rounded-tl-sm'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={bottomRef} />
                    </>
                )}
            </div>

            {/* ── Input ── */}
            <div className="flex-shrink-0 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 border-t border-border bg-background">
                <div className="flex items-end gap-2">
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message…"
                        rows={1}
                        className="flex-1 bg-muted rounded-2xl px-4 py-3 text-sm resize-none outline-none placeholder:text-muted-foreground max-h-28 leading-snug"
                        style={{ minHeight: '44px' }}
                    />
                    <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={handleSend}
                        disabled={!text.trim()}
                        className="w-11 h-11 rounded-full bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
                    >
                        <PaperPlaneTilt size={20} weight="fill" className="text-primary-foreground" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    )
}
