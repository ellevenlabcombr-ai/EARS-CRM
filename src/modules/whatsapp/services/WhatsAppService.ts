import { EvolutionProvider } from '../providers/EvolutionProvider'
import { SendMessageDTO } from '../types/whatsapp.types'

export class WhatsAppService {
  private provider = new EvolutionProvider()

  async createInstance(instanceName: string) {
    return this.provider.createInstance(instanceName)
  }

  async fetchQRCode(instanceName: string) {
    return this.provider.fetchQRCode(instanceName)
  }

  async sendMessage(data: SendMessageDTO) {
    return this.provider.sendText(
      data.instanceName,
      data.number,
      data.text
    )
  }

  async restart(instanceName: string) {
    return this.provider.restartInstance(instanceName)
  }
}
