// Client-side wrapper that calls the server endpoint
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim()
const apiBaseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/$/, '') : ''

export async function extractRecipeFromImageClient(imageDataUrl: string, userId: string, idToken?: string) {
  try {
    if (!userId) {
      throw new Error('Missing user ID for extraction request')
    }
    const endpoint = apiBaseUrl ? `${apiBaseUrl}/api/extract-recipe` : '/api/extract-recipe'

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageDataUrl, userId })
    })

    const raw = await response.text()

    if (!response.ok) {
      let message = raw
      try {
        const parsed = JSON.parse(raw)
        message = parsed?.error || message
      } catch {
        // ignore, response was not JSON
      }

      if (response.status === 404) {
        message = 'Recipe extraction API not available locally. Set VITE_API_BASE_URL to your deployed Vercel URL or run the server API.'
      }

      throw new Error(message || `Request failed with status ${response.status}`)
    }

    try {
      return JSON.parse(raw)
    } catch (err) {
      console.error('Failed to parse server response:', raw)
      throw new Error('Server returned invalid JSON')
    }
  } catch (error: any) {
    console.error('Client extraction error:', error)
    throw error
  }
}

export async function extractRecipeFromUrlClient(url: string, userId: string, idToken?: string) {
  try {
    if (!userId) {
      throw new Error('Missing user ID for extraction request')
    }
    const endpoint = apiBaseUrl ? `${apiBaseUrl}/api/extract-recipe-url` : '/api/extract-recipe-url'

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url, userId })
    })

    const raw = await response.text()

    if (!response.ok) {
      let message = raw
      try {
        const parsed = JSON.parse(raw)
        message = parsed?.error || message
      } catch {
        // ignore, response was not JSON
      }

      if (response.status === 404) {
        message = 'Recipe URL extraction API not available locally. Set VITE_API_BASE_URL to your deployed Cloud Function URL.'
      }

      throw new Error(message || `Request failed with status ${response.status}`)
    }

    try {
      return JSON.parse(raw)
    } catch (err) {
      console.error('Failed to parse server response:', raw)
      throw new Error('Server returned invalid JSON')
    }
  } catch (error: any) {
    console.error('Client URL extraction error:', error)
    throw error
  }
}
