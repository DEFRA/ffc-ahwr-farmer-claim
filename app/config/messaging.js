const Joi = require('joi')

const msgTypePrefix = 'uk.gov.ffc.ahwr'

const mqSchema = Joi.object({
  messageQueue: {
    host: Joi.string().required(),
    username: Joi.string(),
    password: Joi.string(),
    useCredentialChain: Joi.bool().default(false),
    appInsights: Joi.object()
  },
  applicationRequestQueue: {
    address: process.env.APPLICATIONREQUEST_QUEUE_ADDRESS,
    type: 'queue'
  },
  applicationRequestMsgType: `${msgTypePrefix}.app.request`,
  applicationResponseQueue: {
    address: process.env.APPLICATIONRESPONSE_QUEUE_ADDRESS,
    type: 'queue'
  },
  fetchApplicationRequestMsgType: `${msgTypePrefix}.fetch.app.request`,
  fetchClaimRequestMsgType: `${msgTypePrefix}.fetch.claim.request`,
  submitClaimRequestMsgType: `${msgTypePrefix}.submit.claim.request`
})

const mqConfig = {
  messageQueue: {
    host: process.env.MESSAGE_QUEUE_HOST,
    username: process.env.MESSAGE_QUEUE_USER,
    password: process.env.MESSAGE_QUEUE_PASSWORD,
    useCredentialChain: process.env.NODE_ENV === 'production',
    appInsights: process.env.NODE_ENV === 'production' ? require('applicationinsights') : undefined
  },
  applicationRequestQueue: {
    address: process.env.APPLICATIONREQUEST_QUEUE_ADDRESS,
    type: 'queue'
  },
  applicationRequestMsgType: `${msgTypePrefix}.app.request`,
  applicationResponseQueue: {
    address: process.env.APPLICATIONRESPONSE_QUEUE_ADDRESS,
    type: 'queue'
  },
  fetchApplicationRequestMsgType: `${msgTypePrefix}.fetch.app.request`,
  fetchClaimRequestMsgType: `${msgTypePrefix}.fetch.claim.request`,
  submitClaimRequestMsgType: `${msgTypePrefix}.submit.claim.request`
}

const mqResult = mqSchema.validate(mqConfig, {
  abortEarly: false
})

if (mqResult.error) {
  throw new Error(`The message queue config is invalid. ${mqResult.error.message}`)
}

const applicationRequestQueue = { ...mqResult.value.messageQueue, ...mqResult.value.applicationRequestQueue }
const applicationResponseQueue = { ...mqResult.value.messageQueue, ...mqResult.value.applicationResponseQueue }
const fetchApplicationRequestQueue = { ...mqResult.value.messageQueue, ...mqResult.value.fetchApplicationRequestQueue }
const applicationRequestMsgType = mqResult.value.applicationRequestMsgType
const fetchApplicationRequestMsgType = mqResult.value.fetchApplicationRequestMsgType
const fetchClaimRequestMsgType = mqResult.value.fetchClaimRequestMsgType
const submitClaimRequestMsgType = mqResult.value.submitClaimRequestMsgType

module.exports = {
  applicationRequestQueue,
  applicationResponseQueue,
  applicationRequestMsgType,
  fetchApplicationRequestQueue,
  fetchApplicationRequestMsgType,
  fetchClaimRequestMsgType,
  submitClaimRequestMsgType
}
