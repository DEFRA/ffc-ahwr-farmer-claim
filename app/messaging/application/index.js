import { applicationRequestQueue, applicationResponseQueue, mqConfig } from '../../config/messaging.js'
import { sendMessage } from '../send-message.js'
import { receiveMessage } from '../receive-message.js'

const { fetchApplicationRequestMsgType, fetchClaimRequestMsgType } = mqConfig

export async function getApplication (applicationReference, sessionId) {
  await sendMessage({ applicationReference }, fetchApplicationRequestMsgType, applicationRequestQueue, { sessionId })
  return receiveMessage(sessionId, applicationResponseQueue)
}

export async function getClaim (email, sessionId) {
  await sendMessage({ email }, fetchClaimRequestMsgType, applicationRequestQueue, { sessionId })
  return receiveMessage(sessionId, applicationResponseQueue)
}
