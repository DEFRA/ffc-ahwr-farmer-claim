const Wreck = require('@hapi/wreck')
const config = require('../config')

async function getClaimsByApplicationReference (applicationReference) {
  try {
    const response = await Wreck.get(
      `${config.applicationApiUri}/claim/get-by-application-reference/${applicationReference}`,
      { json: true }
    )
    if (response.res.statusCode !== 200) {
      throw new Error(`HTTP ${response.res.statusCode} (${response.res.statusMessage})`)
    }
    return response.payload
  } catch (error) {
    console.error(`${new Date().toISOString()} Getting claims for application with reference ${applicationReference} failed`)
    return null
  }
}

function isWithInLastTenMonths (application) {
  const start = new Date(application.createdAt)
  const end = new Date(start)

  end.setMonth(end.getMonth() + 10)
  end.setHours(24, 0, 0, 0) // set to midnight of agreement end day

  return !(Date.now() > end)
}

module.exports = {
  isWithInLastTenMonths,
  getClaimsByApplicationReference
}
