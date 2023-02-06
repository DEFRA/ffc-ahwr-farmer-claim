const Wreck = require('@hapi/wreck')
const config = require('../config')

async function getLatestApplicationForEachSbi (emailAddress) {
  try {
    const response = await Wreck.get(
      `${config.applicationApiUri}/applications/latest?businessEmail=${emailAddress}`,
      { json: true }
    )
    if (response.res.statusCode !== 200) {
      console.log(`Bad response: ${response.res.statusCode} - ${response.res.statusMessage}`)
      return null
    }
    return response.payload
  } catch (err) {
    console.error(`applicationApiUri.getLatestApplicationForEachSbi failed: ${err.message}`)
    return null
  }
}

module.exports = {
  getLatestApplicationForEachSbi
}
