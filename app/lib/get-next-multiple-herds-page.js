import { getReviewTestResultWithinLast10Months, getReviewWithinLast10Months } from '../api-requests/claim-service-api.js'
import { getEndemicsClaim, setEndemicsClaim } from '../session/index.js'
import { getLivestockTypes } from './get-livestock-types.js'
import { getReviewType } from './get-review-type.js'
import { sessionKeys } from '../session/keys.js'
import { isVisitDateAfterPIHuntAndDairyGoLive } from './context-helper.js'
import { clearPiHuntSessionOnChange } from './clear-pi-hunt-session-on-change.js'
import { config } from '../config/index.js'
import routes from '../config/routes.js'

const { endemicsDateOfTesting, endemicsSpeciesNumbers } = routes

const {
  endemicsClaim: {
    reviewTestResults: reviewTestResultsKey,
    relevantReviewForEndemics: relevantReviewForEndemicsKey
  }
} = sessionKeys

export const getNextMultipleHerdsPage = (request) => {
  const {
    typeOfReview: typeOfClaim,
    previousClaims,
    latestVetVisitApplication: oldWorldApplication,
    typeOfLivestock,
    reviewTestResults,
    dateOfVisit
  } = getEndemicsClaim(request)

  const { isBeef, isDairy, isPigs } = getLivestockTypes(typeOfLivestock)
  const { isEndemicsFollowUp } = getReviewType(typeOfClaim)

  if (isEndemicsFollowUp) {
    setEndemicsClaim(
      request,
      relevantReviewForEndemicsKey,
      getReviewWithinLast10Months(
        dateOfVisit,
        previousClaims,
        oldWorldApplication,
        typeOfLivestock
      )
    )
  }

  if ((isBeef || isDairy || isPigs) && isEndemicsFollowUp) {
    const piHuntEnabledAndVisitDateAfterGoLive = isVisitDateAfterPIHuntAndDairyGoLive(dateOfVisit)

    if (!piHuntEnabledAndVisitDateAfterGoLive) {
      clearPiHuntSessionOnChange(request, 'dateOfVisit')
    }

    const reviewTestResultsValue = reviewTestResults ?? getReviewTestResultWithinLast10Months(request)

    setEndemicsClaim(
      request,
      reviewTestResultsKey,
      reviewTestResultsValue
    )

    if ((isBeef || isDairy) && (piHuntEnabledAndVisitDateAfterGoLive || reviewTestResultsValue === 'negative')) {
      return `${config.urlPrefix}/${endemicsSpeciesNumbers}`
    }
  }

  return `${config.urlPrefix}/${endemicsDateOfTesting}`
}
