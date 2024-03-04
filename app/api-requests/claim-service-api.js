const Wreck = require('@hapi/wreck')
const _ = require('lodash')
const appInsights = require('applicationinsights')
const config = require('../config')
const { statusesFor10MonthCheck, successfulStatuses, REJECTED } = require('../constants/status')
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
      appInsights.defaultClient.trackException({ exception: response.res.statusMessage })
      throw new Error(
        `HTTP ${response.res.statusCode} (${response.res.statusMessage})`
      )
    }
    return response.payload
  } catch (error) {
    console.error(`${new Date().toISOString()} claim submission failed`)
    appInsights.defaultClient.trackException({ exception: error })
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
  end.setHours(23, 59, 59, 999) // set to midnight of the agreement end day

  return Date.now() <= end
}

function getMostRecentReviewDate (previousClaims, latestVetVisitApplication) {
  const successfulReviewClaims = (previousClaims ?? []).filter((previousClaim) => statusesFor10MonthCheck.includes(previousClaim.statusId) && previousClaim.type === claimType.review)
  if (successfulReviewClaims.length) {
    return new Date(successfulReviewClaims[0].data.dateOfVisit)
  } else if (latestVetVisitApplication && statusesFor10MonthCheck.includes(latestVetVisitApplication?.statusId)) {
    return new Date(latestVetVisitApplication.data.visitDate)
  }
}

function is10MonthsDifference (firstDate, secondDate, comparisonOperator = '') {
  const tenMonthsSinceLastClaim = new Date(secondDate)
  tenMonthsSinceLastClaim.setMonth(tenMonthsSinceLastClaim.getMonth() + config.endemicsClaimExpiryTimeMonths)
  console.log('is10MonthsDifference', firstDate, tenMonthsSinceLastClaim)
  if (comparisonOperator === 'lessThanTenMonths') {
    return firstDate < tenMonthsSinceLastClaim
  }
  return firstDate > tenMonthsSinceLastClaim
}

function isValidReviewDate (previousClaims, dateOfVisit) {
  const priorReviewClaims = (previousClaims ?? []).filter((previousClaim) => statusesFor10MonthCheck.includes(previousClaim.statusId) && previousClaim.type === claimType.review && new Date(previousClaim.data.dateOfVisit) < dateOfVisit)
  const nextReviewClaims = (previousClaims ?? []).filter((previousClaim) => statusesFor10MonthCheck.includes(previousClaim.statusId) && previousClaim.type === claimType.review && new Date(previousClaim.data.dateOfVisit) > dateOfVisit)
  const sortedPriorReviewClaims = _.sortBy(priorReviewClaims, [(priorReviewClaim) => { return new Date(priorReviewClaim.data.dateOfVisit) }])
  const sortedNextReviewClaims = _.sortBy(nextReviewClaims, [(nextReviewClaim) => { return new Date(nextReviewClaim.data.dateOfVisit) }])
  const IsValidPriorReviewDifference = sortedPriorReviewClaims.length ? is10MonthsDifference(dateOfVisit, sortedPriorReviewClaims[sortedPriorReviewClaims.length - 1].data.dateOfVisit) : undefined
  const IsValidNextReviewDifference = sortedNextReviewClaims.length ? is10MonthsDifference(new Date(sortedNextReviewClaims[sortedNextReviewClaims.length - 1].data.dateOfVisit), dateOfVisit) : undefined

  console.log('$$$$$$$$$', sortedNextReviewClaims, priorReviewClaims)
  if ((sortedPriorReviewClaims.length && !IsValidPriorReviewDifference) ||
    (sortedNextReviewClaims.length && !IsValidNextReviewDifference)) {
    return { isValid: false, content: { url: 'https://apply-for-an-annual-health-and-welfare-review.defra.gov.uk/apply/guidance-for-farmers', text: 'There must be at least 10 months between your annual health and welfare reviews.' } }
  }
  return { isValid: true, content: {} }
}

function isValidEndemicsDate (previousClaims, dateOfVisit) {
  const priorFailedReviewClaims = (previousClaims ?? []).filter((previousClaim) => REJECTED === previousClaim.statusId && previousClaim.type === claimType.review && new Date(previousClaim.data.dateOfVisit) < dateOfVisit)
  const priorSuccessFulReviewClaims = (previousClaims ?? []).filter((previousClaim) => successfulStatuses.includes(previousClaim.statusId) && previousClaim.type === claimType.review && new Date(previousClaim.data.dateOfVisit) < dateOfVisit)
  const priorEndemicsClaims = (previousClaims ?? []).filter((previousClaim) => statusesFor10MonthCheck.includes(previousClaim.statusId) && previousClaim.type === claimType.endemics && new Date(previousClaim.data.dateOfVisit) < dateOfVisit)
  const nextEndemicsClaims = (previousClaims ?? []).filter((previousClaim) => statusesFor10MonthCheck.includes(previousClaim.statusId) && previousClaim.type === claimType.endemics && new Date(previousClaim.data.dateOfVisit) > dateOfVisit)
  const sortedPriorFailedReviewClaims = _.sortBy(priorFailedReviewClaims, [(priorReviewClaim) => { return new Date(priorReviewClaim.data.dateOfVisit) }])
  const sortedPriorSuccessFulReviewClaims = _.sortBy(priorSuccessFulReviewClaims, [(priorReviewClaim) => { return new Date(priorReviewClaim.data.dateOfVisit) }])
  const sortedPriorEndemicsClaims = _.sortBy(priorEndemicsClaims, [(priorEndemicsClaim) => { return new Date(priorEndemicsClaim.data.dateOfVisit) }])
  const sortedNextEndemicsClaims = _.sortBy(nextEndemicsClaims, [(nextEndemicsClaim) => { return new Date(nextEndemicsClaim.data.dateOfVisit) }])
  const isValidPriorFailedReviewClaimsDifference = sortedPriorFailedReviewClaims.length ? is10MonthsDifference(dateOfVisit, sortedPriorFailedReviewClaims[sortedPriorFailedReviewClaims.length - 1].data.dateOfVisit, 'lessThanTenMonths') : undefined
  const isValidPriorSuccessFulReviewClaimsDifference = sortedPriorSuccessFulReviewClaims.length ? is10MonthsDifference(dateOfVisit, sortedPriorSuccessFulReviewClaims[sortedPriorSuccessFulReviewClaims.length - 1].data.dateOfVisit, 'lessThanTenMonths') : undefined
  const isValidPriorEndemicsDifference = sortedPriorEndemicsClaims.length ? is10MonthsDifference(dateOfVisit, sortedPriorEndemicsClaims[sortedPriorEndemicsClaims.length - 1].data.dateOfVisit) : undefined
  const isValidNextEndemicsDifference = sortedNextEndemicsClaims.length ? is10MonthsDifference(new Date(sortedNextEndemicsClaims[sortedNextEndemicsClaims.length - 1].data.dateOfVisit), dateOfVisit) : undefined

  console.log('%%%%%%%%%%%%%%%', sortedPriorSuccessFulReviewClaims.length, priorSuccessFulReviewClaims)
  if (sortedPriorFailedReviewClaims.length && !isValidPriorFailedReviewClaimsDifference) {
    return { isValid: false, content: { url: '', text: 'The Dairy Farm - SBI 123456789 had a failed review claim for beef cattle in the last 10 months.' } }
  }

  if (sortedPriorSuccessFulReviewClaims.length && !isValidPriorSuccessFulReviewClaimsDifference) {
    return { isValid: false, content: { url: 'https://fcp-ahwr-prototype.herokuapp.com/v25/farmer/guidance-claim', text: 'There must be no more than 10 months between your annual health and welfare reviews and endemic disease follow-ups.' } }
  }

  if ((sortedPriorEndemicsClaims.length && !isValidPriorEndemicsDifference) ||
    (sortedNextEndemicsClaims.length && !isValidNextEndemicsDifference)) {
    return { isValid: false, content: { url: 'https://fcp-ahwr-prototype.herokuapp.com/v25/farmer/guidance-claim', text: 'There must be at least 10 months between your endemics follow-ups.' } }
  }

  return { isValid: true, content: {} }
}

module.exports = {
  submitNewClaim,
  isWithInLastTenMonths,
  getClaimsByApplicationReference,
  getMostRecentReviewDate,
  isValidReviewDate,
  isValidEndemicsDate,
  is10MonthsDifference
}
