const Wreck = require('@hapi/wreck')
const config = require('../../config')

const acquireSigningKey = async () => {
  console.log(`${new Date().toISOString()} Acquiring the signing key data necessary to validate the signature`)
  try {
    const response = await Wreck.get(
      `${config.authConfig.defraId.hostname}/discovery/v2.0/keys?p=${config.authConfig.defraId.policy}`,
      {
        json: true
      }
    )
    if (response.res.statusCode !== 200) {
      throw new Error(`HTTP ${response.res.statusCode} (${response.res.statusMessage})`)
    }
    return response.payload.keys[0]
  } catch (error) {
    console.log(`${new Date().toISOString()} Error while acquiring the signing key data: ${error.message}`)
    console.error(error)
    return undefined
  }
}

module.exports = acquireSigningKey
