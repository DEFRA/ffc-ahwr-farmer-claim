const { MessageSender } = require('ffc-messaging')

export default async function sendMessage (config, messageToSend) {
  const sender = new MessageSender(config)
  await sender.sendMessage(messageToSend)
  await sender.closeConnection()
}
