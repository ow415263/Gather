// This file is kept for reference/documentation
// During development, the actual API is handled by Vite middleware in vite.config.ts
// During production (deployed on GitHub Spark), this would be the handler

export const POST = async (request: Request) => {
  const { imageDataUrl } = await request.json()
  return new Response(JSON.stringify({ error: 'API not available in this mode' }), { status: 503 })
}
