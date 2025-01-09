const { sendMessage, receiveMessage } = require('../')
const { applicationRequestQueue, fetchApplicationRequestMsgType, fetchClaimRequestMsgType, applicationResponseQueue } = require('../../config').mqConfig

async function getApplication (applicationReference, sessionId) {
  await sendMessage({ applicationReference }, fetchApplicationRequestMsgType, applicationRequestQueue, { sessionId })
  return receiveMessage(sessionId, applicationResponseQueue)
}

async function getClaim (email, sessionId) {
  await sendMessage({ email }, fetchClaimRequestMsgType, applicationRequestQueue, { sessionId })
  return receiveMessage(sessionId, applicationResponseQueue)
}

module.exports = {
  getApplication,
  getClaim
}
