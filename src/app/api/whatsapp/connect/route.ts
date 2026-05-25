import { NextResponse } from 'next/server'

const EVOLUTION_URL = process.env.EVOLUTION_API_URL
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY

const INSTANCE_NAME = 'ears-1779728244110'

export async function GET() {
  try {
    const controller = new AbortController()

    const timeout = setTimeout(() => {
      controller.abort()
    }, 8000)

    const response = await fetch(
      `${EVOLUTION_URL}/instance/connect/${INSTANCE_NAME}`,
      {
        method: 'GET',
        headers: {
          apikey: EVOLUTION_KEY || '',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeout)

    const text = await response.text()

    return new Response(text, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    })
  }
}
