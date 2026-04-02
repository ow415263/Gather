import 'dotenv/config'
import { readFile } from 'fs/promises'
import path from 'path'

import { extractRecipeFromImageServer } from '../src/server/extract'

const toDataUrl = async (filePath: string) => {
  const absolute = path.resolve(filePath)
  const buffer = await readFile(absolute)
  const mime = inferMimeType(absolute)
  const base64 = buffer.toString('base64')
  return `data:${mime};base64,${base64}`
}

const inferMimeType = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.gif':
      return 'image/gif'
    case '.webp':
      return 'image/webp'
    case '.heic':
      return 'image/heic'
    default:
      return 'application/octet-stream'
  }
}

async function main() {
  const [, , inputPath] = process.argv

  if (!inputPath) {
    console.error('Usage: npx tsx scripts/test-extract.ts <path-to-image>')
    process.exit(1)
  }

  const dataUrl = await toDataUrl(inputPath)

  console.log(`Invoking OpenAI extraction for ${inputPath}`)
  const result = await extractRecipeFromImageServer(dataUrl)
  console.log('Extraction result:', JSON.stringify(result, null, 2))
}

main().catch(err => {
  console.error('Extraction failed:', err)
  process.exit(1)
})
