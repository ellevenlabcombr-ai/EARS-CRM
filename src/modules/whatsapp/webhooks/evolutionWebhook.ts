import { WHATSAPP_EVENTS } from '../constants/events'

export async function evolutionWebhook(payload: any) {
  const { event, data } = payload

  switch (event) {
    case 'MESSAGES_UPSERT':
      console.log(
        WHATSAPP_EVENTS.MESSAGE_RECEIVED,
        data
      )
      break

    default:
      console.log('Unhandled event', event)
  }
}
