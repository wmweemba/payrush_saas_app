import { auth } from '@/lib/auth'
import { uploadToR2 } from '@/lib/r2'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024

export async function POST(request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('logo')

    if (!file || typeof file === 'string') {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: 'Only JPEG, PNG, or WebP images are accepted' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return Response.json({ error: 'File must be 2 MB or smaller' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const url = await uploadToR2(buffer, file.name, file.type)

    return Response.json({ data: { url } })
  } catch (err) {
    console.error('[POST /api/branding/upload]', err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
