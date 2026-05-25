export interface SendMessageDTO {
  instanceName: string
  number: string
  text: string
}

export interface CreateInstanceDTO {
  instanceName: string
}

export interface QRCodeResponse {
  base64: string
}

export interface WhatsAppWebhookPayload {
  event: string
  data: any
}
