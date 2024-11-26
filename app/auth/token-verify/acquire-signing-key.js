const wreck = require('@hapi/wreck')
const config = require('../../config')

const acquireSigningKey = async () => {
  const { payload } = await wreck.get(
    `${config.authConfig.defraId.hostname}/discovery/v2.0/keys?p=${config.authConfig.defraId.policy}`,
    {
      json: true
    }
  )

  return payload.keys[0]
}

module.exports = acquireSigningKey
