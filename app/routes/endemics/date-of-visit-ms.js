const { getReviewWithinLast10Months, getReviewTestResultWithinLast10Months } = require('../../api-requests/claim-service-api')
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

const pageUrl = `${config.urlPrefix}/${endemicsDateOfVisit}`

const previousPageUrl = (latestVetVisitApplication, typeOfReview, previousClaims, typeOfLivestock) => {
  const relevantClaims = previousClaims.filter(claim => claim.data.typeOfLivestock === typeOfLivestock)

  const oldWorldClaimTypeOfLivestock = latestVetVisitApplication?.data?.whichReview

  const isFirstTimeEndemicClaimForActiveOldWorldReviewClaim =
    typeOfReview === claimType.endemics &&
    [livestockTypes.beef, livestockTypes.dairy].includes(oldWorldClaimTypeOfLivestock) &&
    relevantClaims.length === 0

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

const getInputErrors = (request, reviewOrFollowUpText) => {
  const inputtedValues = {
    day: request.payload[labels.day],
    month: request.payload[labels.month],
    year: request.payload[labels.year]
  }

  const inputsInError = {
    day: false,
    month: false,
    year: false
  }

  if (inputtedValues.day === '' || Number.isNaN(Number(inputtedValues.day)) || inputtedValues.day > 31) {
    inputsInError.day = true
  }

  if (inputtedValues.month === '' || Number.isNaN(Number(inputtedValues.month)) || inputtedValues.month > 12) {
    inputsInError.month = true
  }

  if (inputtedValues.year === '' || Number.isNaN(Number(inputtedValues.year))) {
    inputsInError.year = true
  }

  const inputsInErrorResults = Object.entries(inputsInError)

  const firstFoundInputError = inputsInErrorResults.find(([_inputName, inputInError]) => inputInError)

  if (firstFoundInputError) {
    const inputNameInError = firstFoundInputError[0]
    return {
      errorSummary: [{
        text: 'Enter a date in the boxes below',
        href: `#visit-date-${inputNameInError}`
      }],
      inputsInError
    }
  }

  const dayInput = request.payload[labels.day].trim()
  const dateSection = dayInput.length === 1 ? `0${dayInput}` : dayInput
  const monthInput = request.payload[labels.month].trim()
  const monthSection = monthInput.length === 1 ? `0${monthInput}` : monthInput

  // Below check is needed because entering 31st Feb gets created as 3rd March
  const dateOfVisit = new Date(`${request.payload[labels.year]}/${monthSection}/${dateSection}`)
  let [date, month, year] = [dateOfVisit.getDate().toString(), (dateOfVisit.getMonth() + 1).toString(), dateOfVisit.getFullYear().toString()]

  if (`${date}`.length === 1) {
    date = `0${date}`
  }

  if (`${month}`.length === 1) {
    month = `0${month}`
  }

  const dateEnteredIsValid = date === dateSection && month === monthSection && year === request.payload[labels.year]

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

  if (dateOfVisit > now) {
    return {
      errorSummary: [{
        text: `Error: The date of ${reviewOrFollowUpText} must be in the past`,
        href: 'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
      }],
      inputsInError: { day: true, month: true, year: true }
    }
  }

  if (new Date(request.payload.dateOfAgreementAccepted) > dateOfVisit) {
    return {
      errorSummary: [{
        text: `Error: The date of ${reviewOrFollowUpText} cannot be before the date your agreement began`,
        href: 'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
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
      const { dateOfVisit, latestVetVisitApplication: oldWorldApplication, typeOfReview, latestVetVisitApplication, previousClaims, typeOfLivestock } =
        session.getEndemicsClaim(request)
      const { isReview } = getReviewType(typeOfReview)
      const reviewOrFollowUpText = isReview ? 'review' : 'follow-up'

      return h.view(`${endemicsDateOfVisit}-ms`, {
        dateOfAgreementAccepted: new Date(oldWorldApplication.createdAt).toISOString().slice(0, 10),
        reviewOrFollowUpText,
        dateOfVisit: {
          day: dateOfVisit ? new Date(dateOfVisit).getDate() : '',
          month: dateOfVisit ? new Date(dateOfVisit).getMonth() + 1 : '',
          year: dateOfVisit ? new Date(dateOfVisit).getFullYear() : ''
        },
        backLink: previousPageUrl(latestVetVisitApplication, typeOfReview, previousClaims, typeOfLivestock)
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
        reference: tempClaimReference
      } = session.getEndemicsClaim(request)

      const { isBeef, isDairy, isPigs, isSheep } = getLivestockTypes(typeOfLivestock)
      const { isReview, isEndemicsFollowUp } = getReviewType(typeOfClaim)
      const reviewOrFollowUpText = isReview ? 'review' : 'follow-up'

      const { errorSummary, inputsInError } = getInputErrors(request, reviewOrFollowUpText)

      if (errorSummary.length) {
        const data = {
          dateOfAgreementAccepted: request.payload.dateOfAgreementAccepted,
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
            dateOfAgreement: data.dateOfAgreementAccepted,
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
