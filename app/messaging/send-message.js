import { createMessage } from './create-message.js'
import { createMessageSender } from './create-message-sender.js'

export const sendMessage = async (body, type, config, options) => {
  const message = createMessage(body, type, options)
  const sender = createMessageSender(config)
  await sender.sendMessage(message)
}
