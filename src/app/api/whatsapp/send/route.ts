import { NextResponse } from 'next/server'
import { WhatsAppService } from '@/modules/whatsapp/services/WhatsAppService'

const service = new WhatsAppService()

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const response = await service.sendMessage(body)

    return NextResponse.json(response)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error: 'Failed to send message',
      },
      {
        status: 500,
      }
    )
  }
}
