import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: NextRequest) {
  try {
    const { messages, athleteName } = await req.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        text: "Oi! Sou o Ears, seu assistente de performance. O administrador ainda não configurou minha chave de API, mas posso te dizer que você deve focar no descanso e hidratação hoje!" 
      });
    }

    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
      }
    });

    const chatContext = messages.map((m: any) => ({
      role: m.direction === 'outbound' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const systemPrompt = `Você é o Ears, um assistente inteligente de performance esportiva. 
    Você está conversando com o atleta ${athleteName}. 
    Seu objetivo é ser empático, direto e técnico quando necessário. 
    Suas respostas devem ser curtas (estilo WhatsApp) e em português do Brasil.
    Sempre incentive o atleta e dê dicas baseadas no que ele relatou (dor, sono, cansaço).`;

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...chatContext
      ],
    });

    return NextResponse.json({ text: result.response.text() });
  } catch (error: any) {
    console.error('Gemini error:', error);
    return NextResponse.json({ text: "Desculpe, tive um pequeno problema técnico agora. Mas continue focado no seu treino!" }, { status: 200 });
  }
}
