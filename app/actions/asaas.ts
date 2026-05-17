'use server';

import { ASAAS_API_URL } from '@/lib/asaas';

export async function createAsaasCustomer(data: {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
}) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error('API do Asaas não configurada.');

  const res = await fetch(`${ASAAS_API_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    },
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.description || 'Erro ao criar cliente no Asaas.');
  }

  return json;
}

export async function createAsaasPayment(data: {
  customer: string;
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error('API do Asaas não configurada.');

  const res = await fetch(`${ASAAS_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
    },
    body: JSON.stringify(data),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.description || 'Erro ao gerar cobrança no Asaas.');
  }

  return json;
}

export async function getAsaasPixQrCode(paymentId: string) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error('API do Asaas não configurada.');

  const res = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
    method: 'GET',
    headers: {
      'access_token': apiKey,
    },
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.description || 'Erro ao obter QR Code PIX no Asaas.');
  }

  return json;
}
