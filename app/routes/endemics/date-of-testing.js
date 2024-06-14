const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const { addError } = require('../utils/validations')
const { ruralPaymentsAgency } = require('../../config')
const { isWithIn4MonthsBeforeOrAfterDateOfVisit, isWithIn4MonthsAfterDateOfVisit, getReviewWithinLast10Months } = require('../../api-requests/claim-service-api')
const validateDateInputDay = require('../govuk-components/validate-date-input-day')
const validateDateInputYear = require('../govuk-components/validate-date-input-year')
const validateDateInputMonth = require('../govuk-components/validate-date-input-month')
const { endemicsClaim: { dateOfTesting: dateOfTestingKey } } = require('../../session/keys')
const { claimType } = require('../../constants/claim')
const { endemicsDateOfVisit, endemicsDateOfTesting, endemicsSpeciesNumbers, endemicsDateOfTestingException } = require('../../config/routes')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')
const { getReviewType } = require('../../lib/get-review-type')

const pageUrl = `${urlPrefix}/${endemicsDateOfTesting}`
const backLink = `${urlPrefix}/${endemicsDateOfVisit}`
const optionSameReviewOrFollowUpDateText = (typeOfReview) => {
  const { isReview } = getReviewType(typeOfReview)
  const reviewOrFollowUpText = isReview ? 'review' : 'follow-up'
  return `When the vet visited the farm for the ${reviewOrFollowUpText}`
}
module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { dateOfVisit, dateOfTesting, latestEndemicsApplication, typeOfReview } = session.getEndemicsClaim(request)
        return h.view(endemicsDateOfTesting, {
          optionSameReviewOrFollowUpDateText: optionSameReviewOrFollowUpDateText(typeOfReview),
          dateOfAgreementAccepted: new Date(latestEndemicsApplication.createdAt).toISOString().slice(0, 10),
          dateOfVisit,
          whenTestingWasCarriedOut: dateOfTesting
            ? {
                value: dateOfVisit === dateOfTesting
                  ? 'whenTheVetVisitedTheFarmToCarryOutTheReview'
                  : 'onAnotherDate',
                onAnotherDate: {
                  day: {
                    value: new Date(dateOfTesting).getDate()
                  },
                  month: {
                    value: new Date(dateOfTesting).getMonth() + 1
                  },
                  year: {
                    value: new Date(dateOfTesting).getFullYear()
                  }
                }
              }
            : {
                dateOfVisit
              },
          backLink
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
          dateOfVisit: Joi.string().required(),
          whenTestingWasCarriedOut: Joi.string()
            .valid('whenTheVetVisitedTheFarmToCarryOutTheReview', 'onAnotherDate')
            .required()
            .messages({
              'any.required': 'Enter the date samples were taken'
            }),

          'on-another-date-day': Joi
            .when('whenTestingWasCarriedOut', {
              switch: [
                {
                  is: 'onAnotherDate',
                  then: validateDateInputDay('on-another-date', 'Date of sampling').messages({
                    'dateInputDay.ifNothingIsEntered': 'Enter the date samples were taken'
                  })
                },
                { is: 'whenTheVetVisitedTheFarmToCarryOutTheReview', then: Joi.allow('') }
              ],
              otherwise: Joi.allow('')
            }),

          'on-another-date-month': Joi
            .when('whenTestingWasCarriedOut', {
              switch: [
                { is: 'onAnotherDate', then: validateDateInputMonth('on-another-date', 'Date of sampling') },
                { is: 'whenTheVetVisitedTheFarmToCarryOutTheReview', then: Joi.allow('') }
              ],
              otherwise: Joi.allow('')
            }),

          'on-another-date-year': Joi
            .when('whenTestingWasCarriedOut', {
              switch: [
                {
                  is: 'onAnotherDate',
                  then: validateDateInputYear('on-another-date', 'Date of sampling', (value, helpers) => {
                    if (value > 9999 || value < 1000) {
                      return value
                    }

                    if (value.whenTestingWasCarriedOut === 'whenTheVetVisitedTheFarmToCarryOutTheReview') {
                      return value
                    }

                    const isValidDate = (year, month, day) => {
                      const dateObject = new Date(year, month - 1, day)
                      return (
                        dateObject.getFullYear() === year &&
                        dateObject.getMonth() === month - 1 &&
                        dateObject.getDate() === day
                      )
                    }

                    if (!isValidDate(
                      +helpers.state.ancestors[0]['on-another-date-year'],
                      +helpers.state.ancestors[0]['on-another-date-month'],
                      +helpers.state.ancestors[0]['on-another-date-day']
                    )) {
                      return value
                    }

                    const dateOfTesting = new Date(
                      helpers.state.ancestors[0]['on-another-date-year'],
                      helpers.state.ancestors[0]['on-another-date-month'] - 1,
                      helpers.state.ancestors[0]['on-another-date-day']
                    )

                    const currentDate = new Date()
                    if (dateOfTesting > currentDate) {
                      return helpers.error('dateOfTesting.future')
                    }

                    const dateOfAgreementAccepted = new Date(helpers.state.ancestors[0].dateOfAgreementAccepted)
                    if (dateOfTesting < dateOfAgreementAccepted) {
                      return helpers.error('dateOfTesting.beforeAgreementDate', {
                        dateOfAgreementAccepted: new Date(dateOfAgreementAccepted)
                          .toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                      })
                    }

                    return value
                  }, {
                    'dateOfTesting.future': 'The date samples were taken must be in the past',
                    'dateOfTesting.beforeAgreementDate': 'The date samples were taken cannot be before the date your agreement began'
                  })
                },
                { is: 'whenTheVetVisitedTheFarmToCarryOutTheReview', then: Joi.allow('') }
              ],
              otherwise: Joi.allow('')
            })
        }),
        failAction: async (request, h, error) => {
          const { dateOfVisit, typeOfReview } = session.getEndemicsClaim(request)
          const errorSummary = []
          if (error.details.find(e => e.context.label === 'whenTestingWasCarriedOut')) {
            errorSummary.push({
              text: error.details.find(e => e.context.label === 'whenTestingWasCarriedOut').message,
              href: '#when-was-endemic-disease-or-condition-testing-carried-out'
            })
          }

          const newError = addError(error, 'on-another-date', 'ifTheDateIsIncomplete', '#when-was-endemic-disease-or-condition-testing-carried-out')
          if (Object.keys(newError).length > 0 && newError.constructor === Object) errorSummary.push(newError)

          return h
            .view(endemicsDateOfTesting, {
              ...request.payload,
              dateOfVisit,
              errorSummary,
              optionSameReviewOrFollowUpDateText: optionSameReviewOrFollowUpDateText(typeOfReview),
              whenTestingWasCarriedOut: {
                value: request.payload.whenTestingWasCarriedOut,
                errorMessage: error.details.find(e => e.context.label === 'whenTestingWasCarriedOut')
                  ? { text: error.details.find(e => e.context.label === 'whenTestingWasCarriedOut').message }
                  : undefined,
                onAnotherDate: {
                  day: {
                    value: request.payload['on-another-date-day'],
                    error: error.details.find(e => e.context.label === 'on-another-date-day' || e.type.startsWith('dateOfTesting'))
                  },
                  month: {
                    value: request.payload['on-another-date-month'],
                    error: error.details.find(e => e.context.label === 'on-another-date-month' || e.type.startsWith('dateOfTesting'))
                  },
                  year: {
                    value: request.payload['on-another-date-year'],
                    error: error.details.find(e => e.context.label === 'on-another-date-year' || e.type.startsWith('dateOfTesting'))
                  },
                  errorMessage: error.details.find(e => e.context.label.startsWith('on-another-date'))
                    ? { text: error.details.find(e => e.context.label.startsWith('on-another-date')).message }
                    : undefined
                }
              },
              backLink
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { dateOfVisit, typeOfReview, previousClaims, latestVetVisitApplication } = session.getEndemicsClaim(request)
        const dateOfTesting = request.payload.whenTestingWasCarriedOut === 'whenTheVetVisitedTheFarmToCarryOutTheReview'
          ? dateOfVisit
          : new Date(
            request.payload['on-another-date-year'],
            request.payload['on-another-date-month'] - 1,
            request.payload['on-another-date-day']
          )

        if (!isWithIn4MonthsBeforeOrAfterDateOfVisit(dateOfVisit, dateOfTesting) && typeOfReview === claimType.review) {
          const errorMessage = 'Samples should have been taken no more than 4 months before or after the date of review.'
          raiseInvalidDataEvent(request, dateOfTestingKey, `Value ${dateOfTesting} is invalid. Error: ${errorMessage}`)
          return h.view(endemicsDateOfTestingException, { backLink: pageUrl, ruralPaymentsAgency, errorMessage }).code(400).takeover()
        }

        if (!isWithIn4MonthsBeforeOrAfterDateOfVisit(dateOfVisit, dateOfTesting) && typeOfReview === claimType.endemics) {
          const errorMessage = 'Samples should have been taken no more than 4 months before or after the date of follow-up.'
          raiseInvalidDataEvent(request, dateOfTestingKey, `Value ${dateOfTesting} is invalid. Error: ${errorMessage}`)
          return h.view(endemicsDateOfTestingException, { backLink: pageUrl, ruralPaymentsAgency, errorMessage }).code(400).takeover()
        }

        const previousReviewClaim = getReviewWithinLast10Months(dateOfVisit, previousClaims, latestVetVisitApplication)
        if (typeOfReview === claimType.endemics && previousReviewClaim && !isWithIn4MonthsAfterDateOfVisit(previousReviewClaim?.data?.dateOfVisit, dateOfTesting)) {
          const errorMessage = 'You must do a review, including sampling, before you do the resulting follow-up.'
          const errorLink = 'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
          raiseInvalidDataEvent(request, dateOfTestingKey, `Value ${dateOfTesting} is invalid. Error: ${errorMessage}`)
          return h.view(endemicsDateOfTestingException, { backLink: pageUrl, ruralPaymentsAgency, errorMessage, errorLink }).code(400).takeover()
        }

        session.setEndemicsClaim(request, dateOfTestingKey, dateOfTesting)

        return h.redirect(`${urlPrefix}/${endemicsSpeciesNumbers}`)
      }
    }
  }
]
