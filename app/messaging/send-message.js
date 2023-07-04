const createMessage = require('./create-message')
const { createMessageSender } = require('./create-message-sender')

const sendMessage = async (body, type, config, options) => {
  const message = createMessage(body, type, options)
  const sender = createMessageSender(config)
  await sender.sendMessage(message)
}

module.exports = sendMessage
