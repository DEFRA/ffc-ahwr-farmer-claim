const { NotifyClient } = require('notifications-node-client')
const { apiKey } = require('../../config').notifyConfig

module.exports = new NotifyClient(apiKey)
