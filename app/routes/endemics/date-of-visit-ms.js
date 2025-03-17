import joi from 'joi'
import appInsights from 'applicationinsights'
import { sessionKeys } from '../../session/keys.js'
import { config } from '../../config/index.js'
import { claimConstants } from '../../constants/claim.js'
import { visitDate } from '../../config/visit-date.js'
import routes from '../../config/routes.js'
import { isValidDate } from '../../lib/date-utils.js'
import { getReviewType } from '../../lib/get-review-type.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { getLivestockTypes } from '../../lib/get-livestock-types.js'
import { getOldWorldClaimFromApplication } from '../../lib/index.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import {
  getReviewTestResultWithinLast10Months,
  getReviewWithinLast10Months
} from '../../api-requests/claim-service-api.js'
import { canMakeEndemicsClaim, canMakeReviewClaim } from '../../lib/can-make-claim.js'
import { PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE, MULTIPLE_SPECIES_RELEASE_DATE } from '../../constants/constants.js'
import { isPIHuntEnabledAndVisitDateAfterGoLive } from '../../lib/context-helper.js'
import { clearPiHuntSessionOnChange } from '../../lib/clear-pi-hunt-session-on-change.js'

const {
  endemicsClaim: {
    reviewTestResults: reviewTestResultsKey, dateOfVisit: dateOfVisitKey,
    relevantReviewForEndemics: relevantReviewForEndemicsKey
  }
} = sessionKeys

const {
  endemicsDateOfVisit,
  endemicsDateOfVisitException,
  endemicsDateOfTesting,
  endemicsSpeciesNumbers,
  endemicsWhichTypeOfReview,
  endemicsVetVisitsReviewTestResults,
  endemicsMultipleSpeciesDateException,
  endemicsDairyFollowUpDateException
} = routes

const { claimType, livestockTypes } = claimConstants
const { labels } = visitDate

const pageUrl = `${config.urlPrefix}/${endemicsDateOfVisit}`

const isMSClaimBeforeMSRelease = (previousClaims, typeOfLivestock, dateOfVisit) => previousClaims?.some(claim => claim.data.typeOfLivestock !== typeOfLivestock) && dateOfVisit < MULTIPLE_SPECIES_RELEASE_DATE

export const previousPageUrl = (latestVetVisitApplication, typeOfReview, previousClaims, typeOfLivestock) => {
  const relevantClaims = previousClaims.filter(claim => claim.data.typeOfLivestock === typeOfLivestock)

  const oldWorldClaimTypeOfLivestock = latestVetVisitApplication?.data?.whichReview

  const isCattleEndemicsClaimForOldWorldReview =
    typeOfReview === claimType.endemics &&
    [livestockTypes.beef, livestockTypes.dairy].includes(oldWorldClaimTypeOfLivestock) &&
    relevantClaims.length === 0 &&
    typeOfLivestock === oldWorldClaimTypeOfLivestock

  if (isCattleEndemicsClaimForOldWorldReview) { return `${config.urlPrefix}/${endemicsVetVisitsReviewTestResults}` }

  return `${config.urlPrefix}/${endemicsWhichTypeOfReview}`
}

const getInputErrors = (request, reviewOrFollowUpText, newWorldApplication) => {
  const dateSchema = joi.object({
    'visit-date-day': joi.number().max(31),
    'visit-date-month': joi.number().max(12),
    'visit-date-year': joi.number()
  }).options({ abortEarly: false }) // needed otherwise it doesnt check other fields if an error is found

  const { error } = dateSchema.validate(request.payload)

  const inputsInError = {
    day: false,
    month: false,
    year: false
  }

  const inputKeysInError = error?.details?.map(({ context }) => context.key) || []

  Object.keys(inputsInError).forEach(input => {
    if (inputKeysInError.includes(`visit-date-${input}`)) {
      inputsInError[input] = true
    }
  })

  if (inputKeysInError.length > 0) {
    const inputNameInError = inputKeysInError[0]
    return {
      errorSummary: [{
        text: 'Enter a date in the boxes below',
        href: `#${inputNameInError}`
      }],
      inputsInError
    }
  }

  const [day, month, year] = Object.values(request.payload)
  const dateEnteredIsValid = isValidDate(Number(year), Number(month), Number(day))

  if (!dateEnteredIsValid) {
    return {
      errorSummary: [{
        text: 'Error: The date of review must be a real date',
        href: '#visit-date-day'
      }],
      inputsInError: { day: true, month: true, year: true }
    }
  }

  const now = new Date()
  const dateOfVisit = new Date(year, month - 1, day)

  if (dateOfVisit > now) {
    return {
      errorSummary: [{
        text: `Error: The date of ${reviewOrFollowUpText} must be in the past`,
        href: '#visit-date-day'
      }],
      inputsInError: { day: true, month: true, year: true }
    }
  }

  const applicationCreatedTime = new Date(newWorldApplication.createdAt).setHours(0, 0, 0, 0)

  if (applicationCreatedTime > dateOfVisit.getTime()) {
    return {
      errorSummary: [{
        text: `Error: The date of ${reviewOrFollowUpText} cannot be before the date your agreement began`,
        href: '#visit-date-day'
      }],
      inputsInError: { day: true, month: true, year: true }
    }
  }

  return {
    errorSummary: [],
    inputsInError: { day: false, month: false, year: false }
  }
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { dateOfVisit, typeOfReview, latestVetVisitApplication: oldWorldApplication, previousClaims, typeOfLivestock } =
        getEndemicsClaim(request)
      const { isReview } = getReviewType(typeOfReview)
      const reviewOrFollowUpText = isReview ? 'review' : 'follow-up'

      return h.view(`${endemicsDateOfVisit}-ms`, {
        reviewOrFollowUpText,
        dateOfVisit: {
          day: dateOfVisit ? new Date(dateOfVisit).getDate() : '',
          month: dateOfVisit ? new Date(dateOfVisit).getMonth() + 1 : '',
          year: dateOfVisit ? new Date(dateOfVisit).getFullYear() : ''
        },
        backLink: previousPageUrl(oldWorldApplication, typeOfReview, previousClaims, typeOfLivestock)
      })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const {
        typeOfReview: typeOfClaim,
        previousClaims,
        latestVetVisitApplication: oldWorldApplication,
        typeOfLivestock,
        organisation,
        reviewTestResults,
        reference: tempClaimReference,
        latestEndemicsApplication: newWorldApplication
      } = getEndemicsClaim(request)

      const { isBeef, isDairy, isPigs, isSheep } = getLivestockTypes(typeOfLivestock)
      const { isReview, isEndemicsFollowUp } = getReviewType(typeOfClaim)
      const reviewOrFollowUpText = isReview ? 'review' : 'follow-up'

      const { errorSummary, inputsInError } = getInputErrors(request, reviewOrFollowUpText, newWorldApplication)

      if (errorSummary.length) {
        const data = {
          reviewOrFollowUpText,
          errorSummary,
          dateOfVisit: {
            day: request.payload[labels.day],
            month: request.payload[labels.month],
            year: request.payload[labels.year]
          },
          backLink: previousPageUrl(oldWorldApplication, typeOfClaim, previousClaims, typeOfLivestock),
          inputsInError
        }

        appInsights.defaultClient.trackEvent({
          name: 'claim-invalid-date-of-visit',
          properties: {
            tempClaimReference,
            dateOfAgreement: newWorldApplication.createdAt.toLocaleString('en-GB', { year: 'numeric', month: 'numeric', day: 'numeric' })
              .split('/')
              .reverse()
              .join('-'),
            dateEntered: `${data.dateOfVisit.year}-${data.dateOfVisit.month}-${data.dateOfVisit.day}`,
            journeyType: reviewOrFollowUpText,
            error: errorSummary[0].text
          }
        })

        return h.view(`${endemicsDateOfVisit}-ms`, data).code(400).takeover()
      }

      const formattedTypeOfLivestock = isPigs || isSheep ? typeOfLivestock : `${typeOfLivestock} cattle`

      const dateOfVisit = new Date(request.payload[labels.year], request.payload[labels.month] - 1, request.payload[labels.day])

      let exception
      let exceptionView

      if (isDairy && isEndemicsFollowUp && dateOfVisit < PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE) {
        exception = `User is attempting to claim for dairy follow-up with a date of visit of ${dateOfVisit} which is before dairy follow-ups was enabled.`
        exceptionView = endemicsDairyFollowUpDateException
      } else if (isMSClaimBeforeMSRelease(previousClaims, typeOfLivestock, dateOfVisit)) {
        exception = `User is attempting to claim for MS with a date of visit of ${dateOfVisit} which is before MS was enabled.`
        exceptionView = endemicsMultipleSpeciesDateException
      }

      if (exception) {
        raiseInvalidDataEvent(request, dateOfVisitKey, exception)
        setEndemicsClaim(request, dateOfVisitKey, dateOfVisit)

        return h
          .view(exceptionView, { backLink: pageUrl, ruralPaymentsAgency: config.ruralPaymentsAgency })
          .code(400)
          .takeover()
      }

      const prevLivestockClaims = previousClaims.filter(claim => claim.data.typeOfLivestock === typeOfLivestock)
      const prevReviewClaim = prevLivestockClaims.find(claim => claim.type === claimType.review) || getOldWorldClaimFromApplication(oldWorldApplication, typeOfLivestock)
      const prevEndemicsClaim = prevLivestockClaims.find(claim => claim.type === claimType.endemics)

      const errorMessage = isReview
        ? canMakeReviewClaim(dateOfVisit, prevReviewClaim?.data.dateOfVisit)
        : canMakeEndemicsClaim(dateOfVisit, prevReviewClaim, prevEndemicsClaim?.data.dateOfVisit, organisation, formattedTypeOfLivestock)

      if (errorMessage) {
        raiseInvalidDataEvent(
          request,
          dateOfVisitKey,
          `Value ${dateOfVisit} is invalid. Error: ${errorMessage}`
        )

        setEndemicsClaim(request, dateOfVisitKey, dateOfVisit)

        return h
          .view(`${endemicsDateOfVisitException}-ms`, {
            backLink: pageUrl,
            errorMessage,
            ruralPaymentsAgency: config.ruralPaymentsAgency,
            backToPageMessage: `Enter the date the vet last visited your farm for this ${isReview ? 'review' : 'follow-up'}.`
          })
          .code(400)
          .takeover()
      }

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

      setEndemicsClaim(request, dateOfVisitKey, dateOfVisit)

      if ((isBeef || isDairy || isPigs) && isEndemicsFollowUp) {
        const piHuntEnabledAndVisitDateAfterGoLive = isPIHuntEnabledAndVisitDateAfterGoLive(dateOfVisit)

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
          return h.redirect(`${config.urlPrefix}/${endemicsSpeciesNumbers}`)
        }
      }
      return h.redirect(`${config.urlPrefix}/${endemicsDateOfTesting}`)
    }
  }
}

export const dateOfVisitMSHandlers = [getHandler, postHandler]
