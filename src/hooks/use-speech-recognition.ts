import { useState, useEffect, useRef, useCallback } from 'react'

interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    start: () => void
    stop: () => void
    abort: () => void
    onresult: (event: any) => void
    onerror: (event: any) => void
    onend: () => void
}

declare global {
    interface Window {
        SpeechRecognition: any
        webkitSpeechRecognition: any
    }
}

interface UseSpeechRecognitionReturn {
    isListening: boolean
    transcript: string
    interimTranscript: string
    startListening: () => void
    stopListening: () => void
    resetTranscript: () => void
    hasRecognitionSupport: boolean
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [hasRecognitionSupport, setHasRecognitionSupport] = useState(false)

    const recognitionRef = useRef<SpeechRecognition | null>(null)

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (SpeechRecognition) {
            setHasRecognitionSupport(true)
            recognitionRef.current = new SpeechRecognition()
            const recognition = recognitionRef.current

            if (recognition) {
                recognition.continuous = true
                recognition.interimResults = true
                recognition.lang = 'en-US'

                recognition.onresult = (event: any) => {
                    let currentInterimTranscript = ''
                    let currentFinalTranscript = ''

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcriptSegment = event.results[i][0].transcript
                        if (event.results[i].isFinal) {
                            currentFinalTranscript += transcriptSegment
                        } else {
                            currentInterimTranscript += transcriptSegment
                        }
                    }

                    if (currentFinalTranscript) {
                        setTranscript(prev => prev ? `${prev} ${currentFinalTranscript}` : currentFinalTranscript)
                    }
                    setInterimTranscript(currentInterimTranscript)
                }

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error)
                    setIsListening(false)
                }

                recognition.onend = () => {
                    setIsListening(false)
                }
            }
        }
    }, [])

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start()
                setIsListening(true)
            } catch (error) {
                console.error('Failed to start speech recognition:', error)
            }
        }
    }, [isListening])

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        }
    }, [isListening])

    const resetTranscript = useCallback(() => {
        setTranscript('')
        setInterimTranscript('')
    }, [])

    return {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript,
        hasRecognitionSupport
    }
}
