import { env } from '@/config/env'

export class EvolutionProvider {
  private baseUrl = env.evolutionUrl
  private apiKey = env.evolutionKey

  private headers() {
    return {
      'Content-Type': 'application/json',
      apikey: this.apiKey,
    }
  }

  async createInstance(instanceName: string) {
    const response = await fetch(
      `${this.baseUrl}/instance/create`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          instanceName,
        }),
      }
    )

    return response.json()
  }

  async fetchQRCode(instanceName: string) {
    const response = await fetch(
      `${this.baseUrl}/instance/connect/${instanceName}`,
      {
        method: 'GET',
        headers: this.headers(),
      }
    )

    return response.json()
  }

  async sendText(
    instanceName: string,
    number: string,
    text: string
  ) {
    const response = await fetch(
      `${this.baseUrl}/message/sendText/${instanceName}`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          number,
          text,
        }),
      }
    )

    return response.json()
  }

  async restartInstance(instanceName: string) {
    const response = await fetch(
      `${this.baseUrl}/instance/restart/${instanceName}`,
      {
        method: 'PUT',
        headers: this.headers(),
      }
    )

    return response.json()
  }
}
