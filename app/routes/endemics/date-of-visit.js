const Joi = require('joi')
const {
  isValidDateOfVisit,
  getReviewWithinLast10Months,
  getReviewTestResultWithinLast10Months,
  isFirstTimeEndemicClaimForActiveOldWorldReviewClaim
} = require('../../api-requests/claim-service-api')
const { livestockTypes, claimType, dateOfVetVisitExceptions } = require('../../constants/claim')
const { labels } = require('../../config/visit-date')
const session = require('../../session')
const {
  endemicsClaim: { reviewTestResults: reviewTestResultsKey }
} = require('../../session/keys')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')
const config = require('../../../app/config')
const urlPrefix = require('../../config').urlPrefix
const { endemicsDateOfVisit, endemicsDateOfVisitException, endemicsDateOfTesting, endemicsVetVisitsReviewTestResults, endemicsSpeciesNumbers } = require('../../config/routes')
const {
  endemicsClaim: { dateOfVisit: dateOfVisitKey, relevantReviewForEndemics: relevantReviewForEndemicsKey }
} = require('../../session/keys')
const validateDateInputDay = require('../govuk-components/validate-date-input-day')
const validateDateInputMonth = require('../govuk-components/validate-date-input-month')
const validateDateInputYear = require('../govuk-components/validate-date-input-year')
const { addError } = require('../utils/validations')
const { getReviewType } = require('../../lib/get-review-type')

const pageUrl = `${urlPrefix}/${endemicsDateOfVisit}`
const previousPageUrl = (request) => {
  const { landingPage } = session.getEndemicsClaim(request)

  if (isFirstTimeEndemicClaimForActiveOldWorldReviewClaim(request)) return `${urlPrefix}/${endemicsVetVisitsReviewTestResults}`

  return landingPage
}

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
            day: {
              value: new Date(dateOfVisit).getDate()
            },
            month: {
              value: new Date(dateOfVisit).getMonth() + 1
            },
            year: {
              value: new Date(dateOfVisit).getFullYear()
            }
          },
          backLink: previousPageUrl(request)
        })
      }
    }
  },
  {
    method: 'POST',
    path: pageUrl,
    options: {
      validate: {
        payload: Joi.object({
          dateOfAgreementAccepted: Joi.string().required(),
          [labels.day]: Joi.when('dateOfAgreementAccepted', {
            switch: [
              {
                is: Joi.exist(),
                then: validateDateInputDay('visit-date', 'Date of visit').messages({
                  'dateInputDay.ifNothingIsEntered': 'Enter the date of'
                })
              }
            ]
          }),

          [labels.month]: Joi.when('dateOfAgreementAccepted', {
            switch: [{ is: Joi.exist(), then: validateDateInputMonth('visit-date', 'Date of visit') }]
          }),

          [labels.year]: Joi.when('dateOfAgreementAccepted', {
            switch: [
              {
                is: Joi.exist(),
                then: validateDateInputYear(
                  'visit-date',
                  'Date of visit',
                  (value, helpers) => {
                    if (value > 9999 || value < 1000) {
                      return value
                    }
                    const isValidDate = (year, month, day) => {
                      const dateObject = new Date(year, month - 1, day)
                      return dateObject.getFullYear() === year && dateObject.getMonth() === month - 1 && dateObject.getDate() === day
                    }
                    if (!isValidDate(+helpers.state.ancestors[0][labels.year], +helpers.state.ancestors[0][labels.month], +helpers.state.ancestors[0][labels.day])) {
                      return value
                    }

                    const dateOfVisit = new Date(
                      Date.UTC(helpers.state.ancestors[0][labels.year], helpers.state.ancestors[0][labels.month] - 1, helpers.state.ancestors[0][labels.day])
                    )

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
                  },
                  {
                    'dateOfVisit.future': 'Date of visit must be in the past',
                    'dateOfVisit.beforeAccepted': 'Date of visit cannot be before the date your agreement began'
                  }
                )
              }
            ]
          })
        }),
        failAction: async (request, h, error) => {
          let errorSummary = []
          const newError = addError(error, 'visit-date', 'ifTheDateIsIncomplete', '#when-was-the-review-completed')
          if (Object.keys(newError).length > 0 && newError.constructor === Object) errorSummary.push(newError)

          const { typeOfReview } = session.getEndemicsClaim(request)
          const { isReview } = getReviewType(typeOfReview)
          const reviewOrFollowUpText = isReview ? 'review' : 'follow-up'

          errorSummary = errorSummary.map((err) => {
            switch (err.text) {
              case 'Enter the date of': return { ...err, text: `Enter the date of ${reviewOrFollowUpText}` }
              case 'Date of visit must be a real date': return { ...err, text: `The date of ${reviewOrFollowUpText} must be a real date` }
              case 'Date of visit must be in the past': return { ...err, text: `The date of ${reviewOrFollowUpText} must be in the past` }
              default: return err
            }
          })
          error.details = error.details.map((err) => {
            switch (err.message) {
              case 'Enter the date of': return { ...err, message: `Enter the date of ${reviewOrFollowUpText}` }
              case 'Date of visit must be a real date': return { ...err, message: `The date of ${reviewOrFollowUpText} must be a real date` }
              case 'Date of visit must be in the past': return { ...err, message: `The date of ${reviewOrFollowUpText} must be in the past` }
              default: return err
            }
          })

          return h
            .view(endemicsDateOfVisit, {
              ...request.payload,
              reviewOrFollowUpText,
              errorSummary,
              dateOfVisit: {
                day: {
                  value: request.payload['visit-date-day'],
                  error: error.details.find((e) => e.context.label === 'visit-date-day' || e.type.startsWith('dateOfVisit'))
                },
                month: {
                  value: request.payload['visit-date-month'],
                  error: error.details.find((e) => e.context.label === 'visit-date-month' || e.type.startsWith('dateOfVisit'))
                },
                year: {
                  value: request.payload['visit-date-year'],
                  error: error.details.find((e) => e.context.label === 'visit-date-year' || e.type.startsWith('dateOfVisit'))
                },
                errorMessage: error.details.find((e) => e.context.label.startsWith('visit-date'))
                  ? { text: error.details.find((e) => e.context.label.startsWith('visit-date')).message }
                  : undefined
              },
              backLink: previousPageUrl(request)
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { typeOfReview, previousClaims, latestVetVisitApplication, typeOfLivestock, organisation, reviewTestResults } = session.getEndemicsClaim(request)
        const { isEndemicsFollowUp } = getReviewType(typeOfReview)
        const formattedTypeOfLivestock = [livestockTypes.pigs, livestockTypes.sheep].includes(typeOfLivestock) ? typeOfLivestock : `${typeOfLivestock} cattle`

        const dateOfVisit = new Date(request.payload[labels.year], request.payload[labels.month] - 1, request.payload[labels.day])
        const { isValid, reason } = isValidDateOfVisit(dateOfVisit, typeOfReview, previousClaims, latestVetVisitApplication)
        const mainMessage = { url: '#' }
        let backToPageMessage = 'Enter the date the vet last visited your farm'
        if (!isValid) {
          switch (reason) {
            case dateOfVetVisitExceptions.reviewWithin10:
              mainMessage.text = 'There must be at least 10 months between your reviews.'
              break
            case dateOfVetVisitExceptions.rejectedReview:
              mainMessage.text = `${organisation?.name} - SBI ${organisation?.sbi} had a failed review claim for ${formattedTypeOfLivestock} in the last 10 months.`
              break
            case dateOfVetVisitExceptions.noReview:
              mainMessage.text = 'There must be no more than 10 months between your reviews and follow-ups.'
              backToPageMessage = 'Enter the date the vet last visited your farm for this follow-up.'
              break
            case dateOfVetVisitExceptions.endemicsWithin10:
              mainMessage.text = 'There must be at least 10 months between your follow-ups.'
              backToPageMessage = 'Enter the date the vet last visited your farm for this follow-up.'
              break
            case dateOfVetVisitExceptions.claimEndemicsBeforeReviewPayment:
              mainMessage.text = 'You must have claimed for your review before you claim for the follow-up that happened after it.'
              mainMessage.url = 'https://apply-for-an-annual-health-and-welfare-review.defra.gov.uk/apply/claim-guidance-for-farmers'
              backToPageMessage = 'Enter the date the vet last visited your farm for this follow-up'
              break
          }
          raiseInvalidDataEvent(request, dateOfVisitKey, `Value ${dateOfVisit} is invalid. Error: ${mainMessage.text}`)
          return h.view(endemicsDateOfVisitException, { backLink: pageUrl, mainMessage, ruralPaymentsAgency: config.ruralPaymentsAgency, backToPageMessage }).code(400).takeover()
        }

        if (typeOfReview === claimType.endemics) {
          session.setEndemicsClaim(request, relevantReviewForEndemicsKey, getReviewWithinLast10Months(dateOfVisit, previousClaims, latestVetVisitApplication))
        }

        session.setEndemicsClaim(request, dateOfVisitKey, dateOfVisit)

        if ([livestockTypes.beef, livestockTypes.dairy, livestockTypes.pigs].includes(typeOfLivestock) && isEndemicsFollowUp) {
          const reviewTestResultsValue = reviewTestResults ?? getReviewTestResultWithinLast10Months(request)
          session.setEndemicsClaim(request, reviewTestResultsKey, reviewTestResultsValue)

          if (reviewTestResultsValue === 'negative' && [livestockTypes.beef, livestockTypes.dairy].includes(typeOfLivestock)) return h.redirect(`${urlPrefix}/${endemicsSpeciesNumbers}`)
        }

        return h.redirect(`${urlPrefix}/${endemicsDateOfTesting}`)
      }
    }
  }
]
