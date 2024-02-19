const Wreck = require('@hapi/wreck')
const config = require('../config')
const { READY_TO_PAY } = require('../constants/application-status')
const { claimType } = require('../constants/claim')

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

async function submitNewClaim (data) {
  try {
    const response = await Wreck.post(`${config.applicationApiUri}/claim`, {
      payload: data,
      json: true
    })
    if (response.res.statusCode !== 200) {
      throw new Error(
        `HTTP ${response.res.statusCode} (${response.res.statusMessage})`
      )
    }
    return response.payload
  } catch (error) {
    console.error(`${new Date().toISOString()} claim submission failed`)
    return null
  }
}

function isWithInLastTenMonths (date) {
  if (!date) {
    return false // Date of visit was introduced more than 10 months ago
  }

  const start = new Date(date)
  const end = new Date(start)

  end.setMonth(end.getMonth() + 10)
  end.setHours(24, 0, 0, 0) // set to midnight of agreement end day

  return !(Date.now() > end)
}

function getMostRecentReviewDate (previousClaims, latestVetVisitApplication) {
  const successfulReviewClaims = (previousClaims ?? []).filter((previousClaim) => previousClaim.statusId === READY_TO_PAY && previousClaim.type === claimType.review)
  if (successfulReviewClaims.length) {
    return new Date(successfulReviewClaims[0].data.dateOfVisit)
  } else if (latestVetVisitApplication && latestVetVisitApplication?.statusId === READY_TO_PAY) {
    return new Date(latestVetVisitApplication.data.visitDate)
  }
}

module.exports = {
  submitNewClaim,
  isWithInLastTenMonths,
  getClaimsByApplicationReference,
  getMostRecentReviewDate
}
