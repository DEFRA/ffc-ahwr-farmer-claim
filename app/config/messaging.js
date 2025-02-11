import Joi from 'joi'
import appInsights from 'applicationinsights'

const msgTypePrefix = 'uk.gov.ffc.ahwr'

export const getMessageQueueConfig = () => {
  const mqSchema = Joi.object({
    messageQueue: {
      host: Joi.string().required(),
      username: Joi.string(),
      password: Joi.string(),
      useCredentialChain: Joi.bool().required(),
      managedIdentityClientId: Joi.string().optional(),
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
    fetchClaimRequestMsgType: `${msgTypePrefix}.fetch.claim.request`
  })

  const mqConfig = {
    messageQueue: {
      host: process.env.MESSAGE_QUEUE_HOST,
      username: process.env.MESSAGE_QUEUE_USER,
      password: process.env.MESSAGE_QUEUE_PASSWORD,
      useCredentialChain: process.env.NODE_ENV === 'production',
      managedIdentityClientId: process.env.AZURE_CLIENT_ID,
      appInsights
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
    fetchClaimRequestMsgType: `${msgTypePrefix}.fetch.claim.request`
  }

  const { error } = mqSchema.validate(mqConfig, {
    abortEarly: false
  })

  if (error) {
    throw new Error(`The message queue config is invalid. ${error.message}`)
  }

  return mqConfig
}

export const mqConfig = getMessageQueueConfig()

export const applicationRequestQueue = { ...mqConfig.messageQueue, ...mqConfig.applicationRequestQueue }
export const applicationResponseQueue = { ...mqConfig.messageQueue, ...mqConfig.applicationResponseQueue }
export const eventQueue = { ...mqConfig.messageQueue, ...mqConfig.eventQueue }
