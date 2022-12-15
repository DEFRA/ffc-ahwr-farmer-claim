import { mqConfig } from './mqConfig'
import sendMessage from './sendMessage'

const { MessageReceiver } = require('ffc-messaging')

export default async function mockResponseMessage (baseResponseMessage, responseQueueAddress, receiverConfig) {
  const processMessage = async (messageReceived, receiver) => {
    console.log('processing received message', messageReceived)
    const messageToSend = {
      ...baseResponseMessage,
      sessionId: messageReceived.messageId
    }

    console.log('sending response message', messageToSend)
    await sendMessage({ ...mqConfig, address: responseQueueAddress }, messageToSend)
    await receiver.completeMessage(messageReceived)
    console.log(`'${baseResponseMessage.type}' response message sent and incoming message completed`)
  }

  let messageReceiver
  const messageAction = message => processMessage(message, messageReceiver)
  messageReceiver = new MessageReceiver(receiverConfig, messageAction)
  await messageReceiver.subscribe()
}
