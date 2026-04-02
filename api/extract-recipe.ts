import type { VercelRequest, VercelResponse } from '@vercel/node'

import { extractRecipeFromImageServer } from '../src/server/extract'

const normalizeOrigin = (value: string): string => {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

const matchesOrigin = (origin: string, pattern: string): boolean => {
  if (pattern === origin) {
    return true
  }
  if (pattern.includes('*')) {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp('^' + escaped.replace(/\*/g, '.*') + '$')
    return regex.test(origin)
  }
  return false
}

const isDefaultDevOrigin = (origin: string): boolean => {
  if (!origin) return false
  if (origin.startsWith('http://localhost')) return true
  if (origin.endsWith('.github.dev')) return true
  if (origin.endsWith('.vercel.app')) return true
  return false
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const allowOriginEnv = (process.env.CORS_ALLOW_ORIGIN || '*').trim()
    const requestOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : ''

    const allowedOrigins: string[] = []
    if (allowOriginEnv !== '*') {
      allowedOrigins.push(
        ...allowOriginEnv
          .split(',')
          .map(origin => origin.trim())
          .filter(Boolean)
      )

      const autoOrigins = [
        normalizeOrigin(process.env.VERCEL_URL || ''),
        normalizeOrigin(process.env.VERCEL_BRANCH_URL || ''),
        normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL || '')
      ].filter(Boolean)

      for (const origin of autoOrigins) {
        if (!allowedOrigins.includes(origin)) {
          allowedOrigins.push(origin)
        }
      }

      const fallbackPatterns = ['https://*.vercel.app', 'https://*.github.dev', 'http://localhost:5173', 'http://localhost:5000']
      for (const pattern of fallbackPatterns) {
        if (!allowedOrigins.includes(pattern)) {
          allowedOrigins.push(pattern)
        }
      }
    }

    let allowOrigin = '*'
    if (allowOriginEnv !== '*') {
      if (!requestOrigin) {
        allowOrigin = allowedOrigins[0] || '*'
      } else {
        const isAllowed = allowedOrigins.some(pattern => matchesOrigin(requestOrigin, pattern)) || isDefaultDevOrigin(requestOrigin)
        if (!isAllowed) {
          const message = 'Origin not allowed'
          if (req.method === 'OPTIONS') {
            res.status(403).end()
          } else {
            res.status(403).json({ error: message })
          }
          return
        }
        allowOrigin = requestOrigin
      }
    }

    const requestedHeaders = req.headers['access-control-request-headers']

    res.setHeader('Access-Control-Allow-Origin', allowOrigin)
    if (typeof requestedHeaders === 'string' && requestedHeaders.length > 0) {
      res.setHeader('Access-Control-Allow-Headers', requestedHeaders)
    } else {
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-User-Id')
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Max-Age', '86400')
    if (allowOrigin !== '*') {
      res.setHeader('Vary', 'Origin')
    }

    if (req.method === 'OPTIONS') {
      res.status(204).end()
      return
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    let imageDataUrl: string | undefined
    let userId: string | undefined
    const rawBody = req.body

    if (rawBody && typeof rawBody === 'object' && !Buffer.isBuffer(rawBody)) {
      imageDataUrl = (rawBody as any).imageDataUrl
      userId = (rawBody as any).userId
    }

    if (!imageDataUrl && typeof rawBody === 'string') {
      try {
        const parsed = JSON.parse(rawBody)
        imageDataUrl = parsed?.imageDataUrl
        userId = parsed?.userId
      } catch {
        // ignore, fall back to query param
      }
    }

    if (!imageDataUrl && req.query?.imageDataUrl) {
      const fromQuery = Array.isArray(req.query.imageDataUrl)
        ? req.query.imageDataUrl[0]
        : req.query.imageDataUrl
      imageDataUrl = fromQuery
    }

    if (!userId && req.query?.userId) {
      const fromQuery = Array.isArray(req.query.userId)
        ? req.query.userId[0]
        : req.query.userId
      userId = fromQuery
    }

    const headerUser = req.headers['x-user-id']
    const headerUserId = Array.isArray(headerUser) ? headerUser[0] : headerUser
    const fallbackUserId = (process.env.DEV_DEFAULT_USER_ID || '').trim()
    const effectiveHeaderUserId = (headerUserId || fallbackUserId || '').trim()

    if (!effectiveHeaderUserId) {
      res.status(401).json({ error: 'Missing authenticated user ID' })
      return
    }

    const normalizedBodyUserId = typeof userId === 'string' ? userId.trim() : ''

    if (!normalizedBodyUserId) {
      res.status(400).json({ error: 'userId is required' })
      return
    }

    if (normalizedBodyUserId !== effectiveHeaderUserId) {
      res.status(403).json({ error: 'User ID mismatch' })
      return
    }

    if (typeof imageDataUrl !== 'string' || imageDataUrl.length === 0) {
      res.status(400).json({ error: 'imageDataUrl is required' })
      return
    }

    try {
      const extracted = await extractRecipeFromImageServer(imageDataUrl)
      res.status(200).json(extracted)
    } catch (error: any) {
      console.error('[Vercel] Extraction error:', error)
      res.status(500).json({ error: error?.message || 'Failed to extract recipe' })
    }
  } catch (error: any) {
    console.error('[Vercel] Handler error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: error?.message || 'Unhandled server error' })
    }
  }
}
