import 'dotenv/config'
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { URL } from 'url'
import handler from '../api/extract-recipe'

type MutableIncomingMessage = IncomingMessage & {
  body?: unknown
  query?: Record<string, any>
}

type VercelLikeResponse = ServerResponse & {
  status: (code: number) => VercelLikeResponse
  json: (payload: unknown) => VercelLikeResponse
}

const port = Number(process.env.LOCAL_API_PORT || 8787)

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url || '/', `http://localhost:${port}`)
  const mutableReq = req as MutableIncomingMessage
  const mutableRes = res as VercelLikeResponse

  mutableReq.query = Object.fromEntries(requestUrl.searchParams.entries())

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  const rawBody = Buffer.concat(chunks).toString('utf8')
  const contentType = req.headers['content-type'] || ''

  if (rawBody.length === 0) {
    mutableReq.body = undefined
  } else if (typeof contentType === 'string' && contentType.includes('application/json')) {
    try {
      mutableReq.body = JSON.parse(rawBody)
    } catch {
      mutableReq.body = rawBody
    }
  } else {
    mutableReq.body = rawBody
  }

  let statusCode = 200
  const headers = new Map<string, string | string[]>()

  mutableRes.status = (code: number) => {
    statusCode = code
    return mutableRes
  }

  const applyHeaders = () => {
    mutableRes.statusCode = statusCode
    for (const [key, value] of headers.entries()) {
      mutableRes.setHeader(key, value)
    }
  }

  mutableRes.setHeader = ((name: string, value: any) => {
    headers.set(name, value)
    ServerResponse.prototype.setHeader.call(mutableRes, name, value)
  }) as any

  mutableRes.json = (payload: unknown) => {
    if (!headers.has('Content-Type')) {
      mutableRes.setHeader('Content-Type', 'application/json')
    }
    applyHeaders()
    mutableRes.end(JSON.stringify(payload))
    return mutableRes
  }

  const originalEnd = mutableRes.end.bind(mutableRes)
  mutableRes.end = ((chunk?: any) => {
    applyHeaders()
    return originalEnd(chunk)
  }) as any

  try {
    await handler(mutableReq as any, mutableRes as any)
  } catch (error) {
    console.error('[local-api] unhandled error:', error)
    if (!mutableRes.headersSent) {
      mutableRes.status(500).json({ error: 'Local server error' })
    }
  }
})

server.listen(port, () => {
  console.log(`[local-api] listening on http://localhost:${port}`)
})
