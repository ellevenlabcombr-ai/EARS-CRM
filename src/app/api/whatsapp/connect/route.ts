import { NextResponse } from 'next/server'

const EVOLUTION_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY

const INSTANCE_NAME = 'ears-1779728244110'

export async function GET() {
  try {
    const response = await fetch(
      `${EVOLUTION_URL}/instance/qrcode/${INSTANCE_NAME}`,
      {
        method: 'GET',
        headers: {
          apikey: EVOLUTION_KEY || '',
        },
        cache: 'no-store',
      }
    )

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get QR code',
        details: String(error),
      },
      { status: 500 }
    )
  }
}
