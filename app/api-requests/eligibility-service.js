const config = require('../config')

async function getEligibleUserByEmail (emailAddress) {
  try {
    const response = await Wreck.get(
      `${config.eligibilityApiUri}/eligibility?emailAddress=${emailAddress}`,
      { json: true }
    )
    if (response.res.statusCode !== 200) {
      console.log(`Bad response: ${response.res.statusCode} - ${response.res.statusMessage}`)
      return null
    }
    return response.payload
  } catch (err) {
    console.error(`eligiblityApiUri.getEligibility failed: ${err.message}`)
    return null
  }  
}

module.exports = {
  getEligibleUserByEmail
}