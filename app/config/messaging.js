import Joi from 'joi'
import appInsights from 'applicationinsights'

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
    eventQueue: {
      address: process.env.EVENT_QUEUE_ADDRESS,
      type: 'queue'
    }
  })

  const config = {
    messageQueue: {
      host: process.env.MESSAGE_QUEUE_HOST,
      username: process.env.MESSAGE_QUEUE_USER,
      password: process.env.MESSAGE_QUEUE_PASSWORD,
      useCredentialChain: process.env.NODE_ENV === 'production',
      managedIdentityClientId: process.env.AZURE_CLIENT_ID,
      appInsights
    },
    eventQueue: {
      address: process.env.EVENT_QUEUE_ADDRESS,
      type: 'queue'
    }
  }

  const { error } = mqSchema.validate(config, {
    abortEarly: false
  })

  if (error) {
    throw new Error(`The message queue config is invalid. ${error.message}`)
  }

  return config
}

export const mqConfig = getMessageQueueConfig()
export const eventQueue = { ...mqConfig.messageQueue, ...mqConfig.eventQueue }
