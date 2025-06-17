import { getReviewWithinLast10Months } from '../api-requests/claim-service-api.js'
import { getEndemicsClaim, setEndemicsClaim } from '../session/index.js'
import { getLivestockTypes, isCows } from './get-livestock-types.js'
import { getReviewType } from './get-review-type.js'
import { sessionKeys } from '../session/keys.js'
import { getReviewHerdId, isVisitDateAfterPIHuntAndDairyGoLive } from './context-helper.js'
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
    dateOfVisit,
    herdId,
    tempHerdId,
    unnamedHerdId
  } = getEndemicsClaim(request)

  const { isSheep } = getLivestockTypes(typeOfLivestock)
  const { isEndemicsFollowUp } = getReviewType(typeOfClaim)

  if (isEndemicsFollowUp) {
    const reviewHerdId = getReviewHerdId({ herdId, tempHerdId, unnamedHerdId })
    const reviewWithinLast10Months = getReviewWithinLast10Months(
      dateOfVisit,
      previousClaims,
      oldWorldApplication,
      typeOfLivestock,
      reviewHerdId
    )

    setEndemicsClaim(
      request,
      relevantReviewForEndemicsKey,
      reviewWithinLast10Months
    )

    if (!isSheep) {
      const piHuntEnabledAndVisitDateAfterGoLive = isVisitDateAfterPIHuntAndDairyGoLive(dateOfVisit)

      if (!piHuntEnabledAndVisitDateAfterGoLive) {
        clearPiHuntSessionOnChange(request, 'dateOfVisit')
      }

      const reviewTestResultsValue = reviewTestResults ?? reviewWithinLast10Months?.data?.testResults
      console.log({
        reviewTestResults,
        reviewWithinLast10MonthsTestResults: reviewWithinLast10Months?.data?.testResults,
        reviewTestResultsValue
      })
      setEndemicsClaim(
        request,
        reviewTestResultsKey,
        reviewTestResultsValue
      )

      if (isCows(typeOfLivestock) && (piHuntEnabledAndVisitDateAfterGoLive || reviewTestResultsValue === 'negative')) {
        return `${config.urlPrefix}/${endemicsSpeciesNumbers}`
      }
    }
  }

  return `${config.urlPrefix}/${endemicsDateOfTesting}`
}
