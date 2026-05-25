import { NextResponse } from 'next/server'

import { evolutionWebhook } from '@/modules/whatsapp/webhooks/evolutionWebhook'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    await evolutionWebhook(body)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error: 'Webhook failed',
      },
      {
        status: 500,
      }
    )
  }
}
