export const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

async function fetchAsaas(endpoint: string, options: RequestInit = {}) {
  const apiKey = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjQ2MjZjYjI5LWE5ZWYtNDlhMS04MjY3LTQ4ZjBjM2I5ZTY2NTo6JGFhY2hfMjQ2ZjQ5ZjYtYjA3MC00NmM4LWJhZDYtN2JjNDNkNDFhODIy';
  
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY não configurada no ambiente.');
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'access_token': apiKey,
  };

  const response = await fetch(`${ASAAS_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error('Asaas API Error:', data);
    throw new Error(data?.errors?.[0]?.description || 'Erro na requisição ao Asaas');
  }

  return data;
}

// Interfaces
export interface AsaasCustomerData {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
}

export interface AsaasPaymentData {
  customer: string; // id do cliente no Asaas
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
}

// Funções
export async function createCustomer(data: AsaasCustomerData) {
  return fetchAsaas('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createPayment(data: AsaasPaymentData) {
  return fetchAsaas('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPayment(id: string) {
  return fetchAsaas(`/payments/${id}`, {
    method: 'GET',
  });
}

export async function createPixQrCode(paymentId: string) {
  return fetchAsaas(`/payments/${paymentId}/pixQrCode`, {
    method: 'GET',
  });
}
