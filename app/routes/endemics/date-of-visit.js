const Joi = require('joi')
const {
  isValidDateOfVisit,
  getReviewWithinLast10Months,
  getReviewTestResultWithinLast10Months,
  isFirstTimeEndemicClaimForActiveOldWorldReviewClaim
} = require('../../api-requests/claim-service-api')
const { dateOfVetVisitExceptions } = require('../../constants/claim')
const { labels } = require('../../config/visit-date')
const session = require('../../session')
const { endemicsClaim: { reviewTestResults: reviewTestResultsKey } } = require('../../session/keys')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')
const config = require('../../../app/config')
const urlPrefix = require('../../config').urlPrefix
const { optionalPIHunt } = require('../../config')
const {
  endemicsDateOfVisit,
  endemicsDateOfVisitException,
  endemicsDateOfTesting,
  endemicsVetVisitsReviewTestResults,
  endemicsSpeciesNumbers
} = require('../../config/routes')
const { endemicsClaim: { dateOfVisit: dateOfVisitKey, relevantReviewForEndemics: relevantReviewForEndemicsKey } } = require('../../session/keys')
const validateDateInputDay = require('../govuk-components/validate-date-input-day')
const validateDateInputMonth = require('../govuk-components/validate-date-input-month')
const validateDateInputYear = require('../govuk-components/validate-date-input-year')
const { addError } = require('../utils/validations')
const { getReviewType } = require('../../lib/get-review-type')
const { getLivestockTypes } = require('../../lib/get-livestock-types')

const pageUrl = `${urlPrefix}/${endemicsDateOfVisit}`

// Helper to get the previous page URL
const getPreviousPageUrl = (request) => {
  const { landingPage } = session.getEndemicsClaim(request)
  return isFirstTimeEndemicClaimForActiveOldWorldReviewClaim(request)
    ? `${urlPrefix}/${endemicsVetVisitsReviewTestResults}`
    : landingPage
}

// Helper for validating the date input
const isValidDateInput = (request, reviewOrFollowUpText) => {
  const dateModel = createDateModel(reviewOrFollowUpText)
  const { error } = dateModel.validate(request.payload)
  const data = error ? getValidationErrorData(request, error, reviewOrFollowUpText) : {}
  return { error, data }
}

// Create a Joi model for date validation
const createDateModel = (reviewOrFollowUpText) => Joi.object({
  dateOfAgreementAccepted: Joi.string().required(),
  [labels.day]: Joi.when('dateOfAgreementAccepted', {
    is: Joi.exist(),
    then: validateDateInputDay('visit-date', `The date of ${reviewOrFollowUpText}`)
      .messages({ 'dateInputDay.ifNothingIsEntered': `Enter the date of ${reviewOrFollowUpText}` })
  }),
  [labels.month]: Joi.when('dateOfAgreementAccepted', {
    is: Joi.exist(),
    then: validateDateInputMonth('visit-date', `The date of ${reviewOrFollowUpText}`)
  }),
  [labels.year]: Joi.when('dateOfAgreementAccepted', {
    is: Joi.exist(),
    then: validateDateInputYear('visit-date', `The date of ${reviewOrFollowUpText}`, dateValidationLogic)
  })
})

// Helper function for date validation logic
const dateValidationLogic = (value, helpers) => {
  const isValidDate = (year, month, day) => {
    const dateObject = new Date(year, month - 1, day)
    return dateObject.getFullYear() === year && dateObject.getMonth() === month - 1 && dateObject.getDate() === day
  }

  const { year, month, day } = helpers.state.ancestors[0]
  if (!isValidDate(+year, +month, +day)) {
    return value
  }

  const dateOfVisit = new Date(Date.UTC(year, month - 1, day))
  const currentDate = new Date()
  const dateOfAgreementAccepted = new Date(helpers.state.ancestors[0].dateOfAgreementAccepted)

  if (dateOfVisit > currentDate) {
    return helpers.error('dateOfVisit.future')
  }

  if (dateOfVisit < dateOfAgreementAccepted) {
    return helpers.error('dateOfVisit.beforeAccepted', {
      dateOfAgreementAccepted: new Date(dateOfAgreementAccepted).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    })
  }

  return value
}

// Extract validation error data
const getValidationErrorData = (request, error, reviewOrFollowUpText) => {
  const errorSummary = []
  const newError = addError(error, 'visit-date', 'ifTheDateIsIncomplete', 'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups')

  if (Object.keys(newError).length) errorSummary.push(newError)

  return {
    ...request.payload,
    reviewOrFollowUpText,
    errorSummary,
    dateOfVisit: getErrorMessagesForDateInput(error, request),
    backLink: getPreviousPageUrl(request)
  }
}

// Get error messages for the date input fields
const getErrorMessagesForDateInput = (error, request) => ({
  day: { value: request.payload['visit-date-day'], error: getErrorDetail(error, 'visit-date-day') },
  month: { value: request.payload['visit-date-month'], error: getErrorDetail(error, 'visit-date-month') },
  year: { value: request.payload['visit-date-year'], error: getErrorDetail(error, 'visit-date-year') },
  errorMessage: error.details.find(e => e.context.label.startsWith('visit-date'))
    ? { text: error.details.find(e => e.context.label.startsWith('visit-date')).message }
    : undefined
})

// Helper for extracting error details
const getErrorDetail = (error, label) => error.details.find(e => e.context.label === label)

// Get error message based on the failure reason
const getErrorMessage = (reason, dateOfVetVisitExceptions, organisation, formattedTypeOfLivestock) => {
  const mainMessage = {}
  let backToPageMessage = 'Enter the date the vet last visited your farm for this review.'

  switch (reason) {
    case dateOfVetVisitExceptions.reviewWithin10:
      mainMessage.text = 'There must be at least 10 months between your reviews.'
      mainMessage.url = 'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
      break
    case dateOfVetVisitExceptions.rejectedReview:
      mainMessage.text = `${organisation?.name} - SBI ${organisation?.sbi} had a failed review claim for ${formattedTypeOfLivestock} in the last 10 months.`
      break
    case dateOfVetVisitExceptions.noReview:
    case dateOfVetVisitExceptions.endemicsWithin10:
      mainMessage.text = 'There must be at least 10 months between your follow-ups.'
      mainMessage.url = 'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
      backToPageMessage = 'Enter the date the vet last visited your farm for this follow-up.'
      break
    case dateOfVetVisitExceptions.claimEndemicsBeforeReviewPayment:
      mainMessage.text = 'Your review claim must have been approved before you claim for the follow-up that happened after it.'
      mainMessage.url = 'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
      backToPageMessage = 'Enter the date the vet last visited your farm for this follow-up.'
      break
  }

  return { mainMessage, backToPageMessage }
}

// Route module
module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { dateOfVisit, latestEndemicsApplication, typeOfReview } = session.getEndemicsClaim(request)
        const { isReview } = getReviewType(typeOfReview)
        const reviewOrFollowUpText = isReview ? 'review' : 'follow-up'

        return h.view(endemicsDateOfVisit, {
          dateOfAgreementAccepted: new Date(latestEndemicsApplication.createdAt).toISOString().slice(0, 10),
          reviewOrFollowUpText,
          dateOfVisit: {
            day: { value: dateOfVisit ? new Date(dateOfVisit).getDate() : '' },
            month: { value: dateOfVisit ? new Date(dateOfVisit).getMonth() + 1 : '' },
            year: { value: dateOfVisit ? new Date(dateOfVisit).getFullYear() : '' }
          },
          backLink: getPreviousPageUrl(request)
        })
      }
    }
  },
  {
    method: 'POST',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const sessionData = session.getEndemicsClaim(request)
        const { typeOfReview, previousClaims, latestVetVisitApplication, typeOfLivestock, organisation } = sessionData
        const { isBeef, isDairy, isPigs, isSheep } = getLivestockTypes(typeOfLivestock)
        const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)
        const reviewOrFollowUpText = isReview ? 'review' : 'follow-up'

        const { error, data } = isValidDateInput(request, reviewOrFollowUpText)
        if (error) return h.view(endemicsDateOfVisit, data).code(400).takeover()

        const formattedTypeOfLivestock = (isPigs || isSheep) ? typeOfLivestock : `${typeOfLivestock} cattle`
        const dateOfVisit = new Date(request.payload[labels.year], request.payload[labels.month] - 1, request.payload[labels.day])
        const { isValid, reason } = isValidDateOfVisit(dateOfVisit, typeOfReview, previousClaims, latestVetVisitApplication)

        if (!isValid) {
          const { mainMessage, backToPageMessage } = getErrorMessage(reason, dateOfVetVisitExceptions, organisation, formattedTypeOfLivestock)
          raiseInvalidDataEvent(request, dateOfVisitKey, `Value ${dateOfVisit} is invalid. Error: ${mainMessage.text}`)
          return h.view(endemicsDateOfVisitException, { backLink: pageUrl, mainMessage, ruralPaymentsAgency: config.ruralPaymentsAgency, backToPageMessage }).code(400).takeover()
        }

        if (isEndemicsFollowUp) {
          session.setEndemicsClaim(request, relevantReviewForEndemicsKey, getReviewWithinLast10Months(dateOfVisit, previousClaims, latestVetVisitApplication))
        }

        session.setEndemicsClaim(request, dateOfVisitKey, dateOfVisit)

        if ((isBeef || isDairy || isPigs) && isEndemicsFollowUp) {
          const reviewTestResultsValue = sessionData.reviewTestResults ?? getReviewTestResultWithinLast10Months(request)
          session.setEndemicsClaim(request, reviewTestResultsKey, reviewTestResultsValue)

          if (isBeef || isDairy) {
            if (optionalPIHunt.enabled || reviewTestResultsValue === 'negative') {
              return h.redirect(`${urlPrefix}/${endemicsSpeciesNumbers}`)
            }
          }
        }

        return h.redirect(`${urlPrefix}/${endemicsDateOfTesting}`)
      }
    }
  }
]
