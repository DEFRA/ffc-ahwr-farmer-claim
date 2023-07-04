const { MessageReceiver } = require('ffc-messaging')

const cachedReceivers = {}

const createMessageReceiver = (config) => {
  if (cachedReceivers[config.address]) {
    return cachedReceivers[config.address]
  }

  const receiver = new MessageReceiver(config)
  cachedReceivers[config.address] = receiver

  return receiver
}

const closeAllConnections = async () => {
  const receiverKeys = Object.keys(cachedReceivers)

  for (const key of receiverKeys) {
    const receiver = cachedReceivers[key]
    await receiver.closeConnection()
    delete cachedReceivers[key]
  }
}

module.exports = {
  createMessageReceiver,
  closeAllConnections,
  cachedReceivers
}
