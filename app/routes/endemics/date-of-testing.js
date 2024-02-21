const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const { endemicsDateOfVisit, endemicsDateOfTesting, endemicsSpeciesNumbers } = require('../../config/routes')
const {
  endemicsClaim: { dateOfTesting: dateOfTestingKey }
} = require('../../session/keys')
const validateDateInputDay = require('../govuk-components/validate-date-input-day')
const validateDateInputMonth = require('../govuk-components/validate-date-input-month')
const validateDateInputYear = require('../govuk-components/validate-date-input-year')

const pageUrl = `${urlPrefix}/${endemicsDateOfTesting}`
const backLink = `${urlPrefix}/${endemicsDateOfVisit}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { dateOfVisit, dateOfTesting } = session.getEndemicsClaim(request)
        return h.view(endemicsDateOfTesting, {
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
          dateOfVisit: Joi.string().required(),
          whenTestingWasCarriedOut: Joi.string()
            .valid('whenTheVetVisitedTheFarmToCarryOutTheReview', 'onAnotherDate')
            .required()
            .messages({
              'any.required': 'Enter the date the vet completed testing'
            }),

          'on-another-date-day': Joi
            .when('whenTestingWasCarriedOut', {
              switch: [
                {
                  is: 'onAnotherDate',
                  then: validateDateInputDay('on-another-date', 'Date of testing').messages({
                    'dateInputDay.ifNothingIsEntered': 'Enter the date the vet completed testing'
                  })
                },
                { is: 'whenTheVetVisitedTheFarmToCarryOutTheReview', then: Joi.allow('') }
              ],
              otherwise: Joi.allow('')
            }),

          'on-another-date-month': Joi
            .when('whenTestingWasCarriedOut', {
              switch: [
                { is: 'onAnotherDate', then: validateDateInputMonth('on-another-date', 'Date of testing') },
                { is: 'whenTheVetVisitedTheFarmToCarryOutTheReview', then: Joi.allow('') }
              ],
              otherwise: Joi.allow('')
            }),

          'on-another-date-year': Joi
            .when('whenTestingWasCarriedOut', {
              switch: [
                {
                  is: 'onAnotherDate',
                  then: validateDateInputYear('on-another-date', 'Date of testing', (value, helpers) => {
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
                    const dateOfVisit = new Date(helpers.state.ancestors[0].dateOfVisit)
                    if (dateOfTesting < dateOfVisit) {
                      return helpers.error('dateOfTesting.beforeVetVisitDate', {
                        dateOfVisit: new Date(dateOfVisit)
                          .toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                      })
                    }
                    return value
                  }, {
                    'dateOfTesting.future': 'Date of sampling must be a real date',
                    'dateOfTesting.beforeVetVisitDate': 'Date of testing cannot be before the review visit date'
                  })
                },
                { is: 'whenTheVetVisitedTheFarmToCarryOutTheReview', then: Joi.allow('') }
              ],
              otherwise: Joi.allow('')
            })
        }),
        failAction: async (request, h, error) => {
          const { dateOfVisit } = session.getEndemicsClaim(request)
          const errorSummary = []
          if (error.details.find(e => e.context.label === 'whenTestingWasCarriedOut')) {
            errorSummary.push({
              text: error.details.find(e => e.context.label === 'whenTestingWasCarriedOut').message,
              href: '#when-was-endemic-disease-or-condition-testing-carried-out'
            })
          }
          if (
            error.details
              .filter(e => e.context.label.startsWith('on-another-date'))
              .filter(e => e.type.indexOf('ifTheDateIsIncomplete') !== -1)
              .length
          ) {
            error.details = error.details
              .filter(e => !e.context.label.startsWith('on-another-date') || e.type.indexOf('ifTheDateIsIncomplete') !== -1)
          }
          if (error.details.filter(e => e.context.label.startsWith('on-another-date')).length) {
            errorSummary.push({
              text: error.details.find(e => e.context.label.startsWith('on-another-date')).message,
              href: '#when-was-endemic-disease-or-condition-testing-carried-out'
            })
          }

          return h
            .view(endemicsDateOfTesting, {
              ...request.payload,
              dateOfVisit,
              errorSummary,
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
        const { dateOfVisit } = session.getEndemicsClaim(request)
        const dateOfTesting = request.payload.whenTestingWasCarriedOut === 'whenTheVetVisitedTheFarmToCarryOutTheReview'
          ? dateOfVisit
          : new Date(
            request.payload['on-another-date-year'],
            request.payload['on-another-date-month'] - 1,
            request.payload['on-another-date-day']
          )
        session.setEndemicsClaim(request, dateOfTestingKey, dateOfTesting)
        return h.redirect(`${urlPrefix}/${endemicsSpeciesNumbers}`)
      }
    }
  }
]
