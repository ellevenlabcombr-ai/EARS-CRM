import { NextResponse } from 'next/server'
import { env } from '@/config/env'

export async function GET() {
  return NextResponse.json({
    evolutionUrl: env.evolutionUrl,
  })
}
