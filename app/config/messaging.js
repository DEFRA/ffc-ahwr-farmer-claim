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
  eventQueue: {
    address: process.env.EVENT_QUEUE_ADDRESS,
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
    appInsights: require('applicationinsights')
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
  eventQueue: {
    address: process.env.EVENT_QUEUE_ADDRESS,
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

const applicationRequestQueue = { ...mqConfig.messageQueue, ...mqConfig.applicationRequestQueue }
const applicationResponseQueue = { ...mqConfig.messageQueue, ...mqConfig.applicationResponseQueue }
const eventQueue = { ...mqConfig.messageQueue, ...mqConfig.eventQueue }
const applicationRequestMsgType = mqConfig.applicationRequestMsgType
const fetchApplicationRequestMsgType = mqConfig.fetchApplicationRequestMsgType
const fetchClaimRequestMsgType = mqConfig.fetchClaimRequestMsgType
const submitClaimRequestMsgType = mqConfig.submitClaimRequestMsgType

module.exports = {
  applicationRequestQueue,
  applicationResponseQueue,
  applicationRequestMsgType,
  eventQueue,
  fetchApplicationRequestMsgType,
  fetchClaimRequestMsgType,
  submitClaimRequestMsgType
}
