const Wreck = require('@hapi/wreck')
const config = require('../config')

async function getLatestApplicationsBySbi (sbi) {
  console.log(`${new Date().toISOString()} Getting latest applications by: ${JSON.stringify({ sbi })}`)
  try {
    const response = await Wreck.get(
      `${config.applicationApiUri}/applications/latest?sbi=${sbi}`,
      { json: true }
    )
    if (response.res.statusCode !== 200) {
      throw new Error(`HTTP ${response.res.statusCode} (${response.res.statusMessage})`)
    }
    return response.payload
  } catch (error) {
    console.error(`${new Date().toISOString()} Getting latest applications failed: ${JSON.stringify({
      sbi
    })}`, error)
    return null
  }
}

module.exports = {
  getLatestApplicationsBySbi
}
