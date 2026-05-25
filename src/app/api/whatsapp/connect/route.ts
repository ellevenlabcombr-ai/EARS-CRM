import { NextResponse } from 'next/server'

const EVOLUTION_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY

const INSTANCE_NAME = 'ears-1779728244110'

export async function GET() {
  try {
    const response = await fetch(
      `${EVOLUTION_URL}/instance/connect/${INSTANCE_NAME}`,
      {
        method: 'GET',
        headers: {
          apikey: EVOLUTION_KEY || '',
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    const text = await response.text()

    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to connect instance',
        details: String(error),
      },
      { status: 500 }
    )
  }
}
