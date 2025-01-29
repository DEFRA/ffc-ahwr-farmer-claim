const { getReviewWithinLast10Months, getReviewTestResultWithinLast10Months } = require('../../api-requests/claim-service-api')
const joi = require('joi')
const { claimType, livestockTypes } = require('../../constants/claim')
const { labels } = require('../../config/visit-date')
const session = require('../../session')
const {
  endemicsClaim: {
    reviewTestResults: reviewTestResultsKey, dateOfVisit: dateOfVisitKey,
    relevantReviewForEndemics: relevantReviewForEndemicsKey
  }
} = require('../../session/keys')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')
const config = require('../../config')
const {
  endemicsDateOfVisit,
  endemicsDateOfVisitException,
  endemicsDateOfTesting,
  endemicsSpeciesNumbers,
  endemicsWhichTypeOfReview,
  endemicsVetVisitsReviewTestResults
} = require('../../config/routes')
const { getReviewType } = require('../../lib/get-review-type')
const { getLivestockTypes } = require('../../lib/get-livestock-types')
const appInsights = require('applicationinsights')
const { canMakeReviewClaim, canMakeEndemicsClaim } = require('../../lib/can-make-claim')
const { isValidDate } = require('../../lib/date-utils')
const { redirectReferenceMissing } = require('../../lib/redirect-reference-missing')

const pageUrl = `${config.urlPrefix}/${endemicsDateOfVisit}`

const previousPageUrl = (latestVetVisitApplication, typeOfReview, previousClaims, typeOfLivestock) => {
  const relevantClaims = previousClaims.filter(claim => claim.data.typeOfLivestock === typeOfLivestock)

  const oldWorldClaimTypeOfLivestock = latestVetVisitApplication?.data?.whichReview

  const isFirstTimeEndemicClaimForActiveOldWorldReviewClaim =
    typeOfReview === claimType.endemics &&
    [livestockTypes.beef, livestockTypes.dairy].includes(oldWorldClaimTypeOfLivestock) &&
    relevantClaims.length === 0 &&
    typeOfLivestock === oldWorldClaimTypeOfLivestock

  if (isFirstTimeEndemicClaimForActiveOldWorldReviewClaim) { return `${config.urlPrefix}/${endemicsVetVisitsReviewTestResults}` }

  return `${config.urlPrefix}/${endemicsWhichTypeOfReview}`
}

const getOldWorldClaimFromApplication = (oldWorldApp, typeOfLivestock) =>
  oldWorldApp && typeOfLivestock === oldWorldApp.data.whichReview
    ? {
        statusId: oldWorldApp.statusId,
        data: {
          claimType: oldWorldApp.data.whichReview,
          dateOfVisit: oldWorldApp.data.visitDate
        }
      }
    : undefined

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

  if (new Date(newWorldApplication.createdAt) > dateOfVisit) {
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
    pre: [{ method: redirectReferenceMissing }],
    handler: async (request, h) => {
      const { dateOfVisit, typeOfReview, previousClaims, typeOfLivestock, latestVetVisitApplication: oldWorldApplication } = session.getEndemicsClaim(request)
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
      } = session.getEndemicsClaim(request)

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

        session.setEndemicsClaim(request, dateOfVisitKey, dateOfVisit)

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
        session.setEndemicsClaim(
          request,
          relevantReviewForEndemicsKey,
          getReviewWithinLast10Months(
            dateOfVisit,
            previousClaims,
            oldWorldApplication
          )
        )
      }

      session.setEndemicsClaim(request, dateOfVisitKey, dateOfVisit)

      if ((isBeef || isDairy || isPigs) && isEndemicsFollowUp) {
        const reviewTestResultsValue = reviewTestResults ?? getReviewTestResultWithinLast10Months(request)

        session.setEndemicsClaim(
          request,
          reviewTestResultsKey,
          reviewTestResultsValue
        )

        if ((isBeef || isDairy) && (config.optionalPIHunt.enabled || reviewTestResultsValue === 'negative')) {
          return h.redirect(`${config.urlPrefix}/${endemicsSpeciesNumbers}`)
        }
      }
      return h.redirect(`${config.urlPrefix}/${endemicsDateOfTesting}`)
    }
  }
}

module.exports = { handlers: [getHandler, postHandler], previousPageUrl }
