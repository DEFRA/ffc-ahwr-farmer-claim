const { sendMessage, receiveMessage } = require('../')
const { applicationRequestQueue, fetchApplicationRequestMsgType, fetchClaimRequestMsgType, applicationResponseQueue, submitClaimRequestMsgType } = require('../../config').mqConfig

async function getApplication (applicationReference, sessionId) {
  await sendMessage({ applicationReference }, fetchApplicationRequestMsgType, applicationRequestQueue, { sessionId })
  return receiveMessage(sessionId, applicationResponseQueue)
}

async function getClaim (email, sessionId) {
  await sendMessage({ email }, fetchClaimRequestMsgType, applicationRequestQueue, { sessionId })
  return receiveMessage(sessionId, applicationResponseQueue)
}

async function submitClaim (submission, sessionId) {
  await sendMessage(submission, submitClaimRequestMsgType, applicationRequestQueue, { sessionId })
  const response = await receiveMessage(sessionId, applicationResponseQueue)
  return response.state
}

async function submitDeadLetter (submission, sessionId) {
  await sendMessage(submission, 'uk.gov.ffc.ahwr.deadletter', applicationRequestQueue, { sessionId })
  const response = await receiveMessage(sessionId, applicationResponseQueue)
  return response
}

module.exports = {
  getApplication,
  getClaim,
  submitClaim,
  submitDeadLetter
}
