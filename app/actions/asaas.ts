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
  try {
    const apiKey = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjQ2MjZjYjI5LWE5ZWYtNDlhMS04MjY3LTQ4ZjBjM2I5ZTY2NTo6JGFhY2hfMjQ2ZjQ5ZjYtYjA3MC00NmM4LWJhZDYtN2JjNDNkNDFhODIy';
    if (!apiKey) return { error: 'API do Asaas não configurada.' };

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
      return { error: json?.errors?.[0]?.description || 'Erro ao criar cliente no Asaas.' };
    }

    return { success: true, data: json };
  } catch (err: any) {
    return { error: err.message || 'Erro interno no servidor.' };
  }
}

export async function createAsaasPayment(data: {
  customer: string;
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
}) {
  try {
    const apiKey = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjQ2MjZjYjI5LWE5ZWYtNDlhMS04MjY3LTQ4ZjBjM2I5ZTY2NTo6JGFhY2hfMjQ2ZjQ5ZjYtYjA3MC00NmM4LWJhZDYtN2JjNDNkNDFhODIy';
    if (!apiKey) return { error: 'API do Asaas não configurada.' };

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
      return { error: json?.errors?.[0]?.description || 'Erro ao gerar cobrança no Asaas.' };
    }

    return { success: true, data: json };
  } catch (err: any) {
    return { error: err.message || 'Erro interno no servidor.' };
  }
}

export async function getAsaasPixQrCode(paymentId: string) {
  try {
    const apiKey = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjQ2MjZjYjI5LWE5ZWYtNDlhMS04MjY3LTQ4ZjBjM2I5ZTY2NTo6JGFhY2hfMjQ2ZjQ5ZjYtYjA3MC00NmM4LWJhZDYtN2JjNDNkNDFhODIy';
    if (!apiKey) return { error: 'API do Asaas não configurada.' };

    const res = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
      },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { error: json?.errors?.[0]?.description || 'Erro ao obter QR Code PIX no Asaas.' };
    }

    return { success: true, data: json };
  } catch (err: any) {
    return { error: err.message || 'Erro interno no servidor.' };
  }
}
