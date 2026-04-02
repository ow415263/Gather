import { useEffect, useState } from 'react'
import { App as CapApp } from '@capacitor/app'

/**
 * Hook to handle incoming URLs from iOS Share Extension or deep links
 * Listens for:
 * - App launch with URL (cold start)
 * - App resumed with URL (from share extension)
 */
export function useAppUrl(onUrlReceived?: (url: string) => void) {
    const [lastUrl, setLastUrl] = useState<string | null>(null)

    useEffect(() => {
        let listenerHandle: Promise<import('@capacitor/core').PluginListenerHandle> | undefined

        // Listen for app URL open events (when app is already running)
        listenerHandle = CapApp.addListener('appUrlOpen', (event) => {
            console.log('[useAppUrl] App opened with URL:', event.url)

            // Parse the URL scheme: fudiapp://recipe?url=https://...
            if (event.url.startsWith('fudiapp://recipe')) {
                const searchParams = new URL(event.url).searchParams
                const recipeUrl = searchParams.get('url')

                if (recipeUrl) {
                    console.log('[useAppUrl] Extracted shared URL:', recipeUrl)
                    setLastUrl(recipeUrl)
                    onUrlReceived?.(recipeUrl)
                }
            }
        })

        // Check if app was launched with a URL (cold start)
        CapApp.getLaunchUrl().then((result) => {
            if (result?.url) {
                console.log('[useAppUrl] App launched with URL:', result.url)

                if (result.url.startsWith('fudiapp://recipe')) {
                    const searchParams = new URL(result.url).searchParams
                    const sharedUrl = searchParams.get('url')

                    if (sharedUrl) {
                        console.log('[useAppUrl] Extracted launch URL:', sharedUrl)
                        setLastUrl(sharedUrl)
                        onUrlReceived?.(sharedUrl)
                    }
                }
            }
        })

        return () => {
            listenerHandle?.then(handle => handle.remove())
        }
    }, [onUrlReceived])

    return { lastUrl }
}
