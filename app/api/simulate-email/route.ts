import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { apiKey, to, subject, html } = await req.json();

    if (!apiKey || !to || !subject || !html) {
      return NextResponse.json({ error: 'Faltam parâmetros obrigatórios. Verifique API Key, Destinatário, Assunto e Conteúdo.' }, { status: 400 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // Default testing domain provided by Resend
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
        return NextResponse.json({ error: data.message || 'Erro na API do Resend', details: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
