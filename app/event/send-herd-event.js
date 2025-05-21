import { getEndemicsClaim } from '../session/index.js'
import { getIpFromRequest } from './get-ip-from-request.js'
import { raiseEvent } from './raise-event.js'

export const sendHerdEvent = async ({ request, type, message, data }) => {
  const ip = getIpFromRequest(request)
  const claim = getEndemicsClaim(request)
  const sessionId = request.yar.id

  const { organisation: { sbi, email }, reference } = claim

  const event = {
    id: sessionId,
    sbi,
    cph: 'n/a',
    reference,
    email,
    name: 'send-session-event',
    type,
    message,
    data,
    ip
  }

  await raiseEvent(event)
}
