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
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'UNDEFINED';
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

export async function checkAsaasStatus(paymentOrSubId: string) {
  try {
    const apiKey = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjQ2MjZjYjI5LWE5ZWYtNDlhMS04MjY3LTQ4ZjBjM2I5ZTY2NTo6JGFhY2hfMjQ2ZjQ5ZjYtYjA3MC00NmM4LWJhZDYtN2JjNDNkNDFhODIy';
    if (!apiKey) return { error: 'API do Asaas não configurada.' };

    let endpoint = '';
    if (paymentOrSubId.startsWith('sub_')) {
      endpoint = `${ASAAS_API_URL}/payments?subscription=${paymentOrSubId}`;
    } else {
      endpoint = `${ASAAS_API_URL}/payments/${paymentOrSubId}`;
    }

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
      },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { error: json?.errors?.[0]?.description || 'Erro ao consultar Asaas.' };
    }

    let paymentData = json;
    if (paymentOrSubId.startsWith('sub_')) {
      if (json.data && json.data.length > 0) {
        // Find if ANY payment is paid
        const paidStatuses = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'RESTORED', 'DUNNING_RECEIVED', 'APPROVED_BY_RISK_ANALYSIS'];
        const paidPayment = json.data.find((p: any) => paidStatuses.includes(p.status));
        if (paidPayment) {
          paymentData = paidPayment;
        } else {
          paymentData = json.data[0]; // fallback
        }
      } else {
        return { success: true, status: 'PENDING' };
      }
    }

    return { success: true, status: paymentData.status };
  } catch (err: any) {
    return { error: err.message || 'Erro interno no servidor.' };
  }
}

export async function createAsaasSubscription(data: {
  customer: string;
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'UNDEFINED';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
}) {
  try {
    const apiKey = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjQ2MjZjYjI5LWE5ZWYtNDlhMS04MjY3LTQ4ZjBjM2I5ZTY2NTo6JGFhY2hfMjQ2ZjQ5ZjYtYjA3MC00NmM4LWJhZDYtN2JjNDNkNDFhODIy';
    if (!apiKey) return { error: 'API do Asaas não configurada.' };

    const res = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify(data),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return { error: json?.errors?.[0]?.description || 'Erro ao gerar assinatura no Asaas.' };
    }

    return { success: true, data: json };
  } catch (err: any) {
    return { error: err.message || 'Erro interno no servidor.' };
  }
}
