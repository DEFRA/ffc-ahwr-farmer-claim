import { getEndemicsClaim } from '../session'
import { getIpFromRequest } from './get-ip-from-request'
import { raiseEvent } from './raise-event'

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
