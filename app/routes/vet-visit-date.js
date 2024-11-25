const Joi = require('joi')
const { labels } = require('../config/visit-date')
const session = require('../session')
const sessionKeys = require('../session/keys')
const config = require('../../app/config')
const { isValidDate } = require('../lib/check-date-validity')
const validateDateInputDay = require('./govuk-components/validate-date-input-day')
const validateDateInputMonth = require('./govuk-components/validate-date-input-month')
const validateDateInputYear = require('./govuk-components/validate-date-input-year')

const templatePath = 'vet-visit-date'
const path = `/claim/${templatePath}`

module.exports = [
  {
    method: 'GET',
    path,
    options: {
      handler: async (request, h) => {
        const agreement = session.getClaim(request)
        const dateOfReview = session.getClaim(
          request,
          sessionKeys.farmerApplyData.visitDate
        )
        const dateOfTesting = session.getClaim(
          request,
          sessionKeys.farmerApplyData.dateOfTesting
        )

        return h.view(templatePath, {
          dateOfTestingEnabled: config.dateOfTesting.enabled,
          dateOfAgreementAccepted: agreement?.createdAt
            ? new Date(agreement.createdAt).toISOString().slice(0, 10)
            : undefined,
          dateOfReview: {
            day: {
              value: dateOfTesting ? new Date(dateOfReview).getDate() : ''
            },
            month: {
              value: dateOfTesting ? new Date(dateOfReview).getMonth() + 1 : ''
            },
            year: {
              value: dateOfTesting ? new Date(dateOfReview).getFullYear() : ''
            }
          },
          whenTestingWasCarriedOut:
            config.dateOfTesting.enabled && dateOfReview
              ? {
                  value:
                  dateOfReview === dateOfTesting
                    ? 'whenTheVetVisitedTheFarmToCarryOutTheReview'
                    : 'onAnotherDate',
                  onAnotherDate: {
                    day: {
                      value: dateOfTesting ? new Date(dateOfTesting).getDate() : ''
                    },
                    month: {
                      value: dateOfTesting ? new Date(dateOfTesting).getMonth() + 1 : ''
                    },
                    year: {
                      value: dateOfTesting ? new Date(dateOfTesting).getFullYear() : ''
                    }
                  }
                }
              : {}
        })
      }
    }
  },
  {
    method: 'POST',
    path,
    options: {
      validate: {
        payload: config.dateOfTesting.enabled
          ? Joi.object({
              dateOfAgreementAccepted: Joi.string().required(),
              [labels.day]: Joi.when('dateOfAgreementAccepted', {
                switch: [
                  {
                    is: Joi.exist(),
                    then: validateDateInputDay(
                      'visit-date',
                      'Date of review'
                    ).messages({
                      'dateInputDay.ifNothingIsEntered':
                      'Enter the date the vet completed the review'
                    })
                  }
                ]
              }),

              [labels.month]: Joi.when('dateOfAgreementAccepted', {
                switch: [
                  {
                    is: Joi.exist(),
                    then: validateDateInputMonth(
                      'visit-date',
                      'Date of review'
                    )
                  }
                ]
              }),

              [labels.year]: Joi.when('dateOfAgreementAccepted', {
                switch: [
                  {
                    is: Joi.exist(),
                    then: validateDateInputYear(
                      'visit-date',
                      'Date of review',
                      (value, helpers) => {
                        if (value > 9999 || value < 1000) {
                          return value
                        }

                        if (
                          !isValidDate(
                            +helpers.state.ancestors[0][labels.year],
                            +helpers.state.ancestors[0][labels.month],
                            +helpers.state.ancestors[0][labels.day]
                          )
                        ) {
                          return value
                        }

                        const dateOfReview = new Date(
                          Date.UTC(
                            helpers.state.ancestors[0][labels.year],
                            helpers.state.ancestors[0][labels.month] - 1,
                            helpers.state.ancestors[0][labels.day]
                          )
                        )

                        const currentDate = new Date()
                        const dateOfAgreementAccepted = new Date(
                          helpers.state.ancestors[0].dateOfAgreementAccepted
                        )

                        if (dateOfReview > currentDate) {
                          return helpers.error('dateOfReview.future')
                        }

                        if (dateOfReview < dateOfAgreementAccepted) {
                          return helpers.error('dateOfReview.beforeAccepted', {
                            dateOfAgreementAccepted: new Date(
                              dateOfAgreementAccepted
                            ).toLocaleString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          })
                        }

                        const endDate = new Date(dateOfAgreementAccepted)
                        endDate.setMonth(
                          endDate.getMonth() + config.claimExpiryTimeMonths
                        )
                        if (dateOfReview > endDate) {
                          return helpers.error('dateOfReview.expired')
                        }

                        return value
                      },
                      {
                        'dateOfReview.future':
                        'The date the review was completed must be in the past',
                        'dateOfReview.beforeAccepted':
                        'Date of review must be the same or after {#dateOfAgreementAccepted} when you accepted your agreement offer',
                        'dateOfReview.expired':
                        'The date the review was completed must be within six months of agreement date'
                      }
                    )
                  }
                ]
              }),

              whenTestingWasCarriedOut: Joi.string()
                .valid(
                  'whenTheVetVisitedTheFarmToCarryOutTheReview',
                  'onAnotherDate'
                )
                .required()
                .messages({
                  'any.required':
                  'Select if testing was carried out when the vet visited the farm or on another date'
                }),

              'on-another-date-day': Joi.when('whenTestingWasCarriedOut', {
                switch: [
                  {
                    is: 'onAnotherDate',
                    then: validateDateInputDay(
                      'on-another-date',
                      'Date of testing'
                    ).messages({
                      'dateInputDay.ifNothingIsEntered':
                      'Enter the date the vet completed testing'
                    })
                  },
                  {
                    is: 'whenTheVetVisitedTheFarmToCarryOutTheReview',
                    then: Joi.allow('')
                  }
                ],
                otherwise: Joi.allow('')
              }),

              'on-another-date-month': Joi.when('whenTestingWasCarriedOut', {
                switch: [
                  {
                    is: 'onAnotherDate',
                    then: validateDateInputMonth(
                      'on-another-date',
                      'Date of testing'
                    )
                  },
                  {
                    is: 'whenTheVetVisitedTheFarmToCarryOutTheReview',
                    then: Joi.allow('')
                  }
                ],
                otherwise: Joi.allow('')
              }),

              'on-another-date-year': Joi.when('whenTestingWasCarriedOut', {
                switch: [
                  {
                    is: 'onAnotherDate',
                    then: validateDateInputYear(
                      'on-another-date',
                      'Date of testing',
                      (value, helpers) => {
                        if (value > 9999 || value < 1000) {
                          return value
                        }

                        if (
                          value.whenTestingWasCarriedOut ===
                        'whenTheVetVisitedTheFarmToCarryOutTheReview'
                        ) {
                          return value
                        }

                        if (
                          !isValidDate(
                            +helpers.state.ancestors[0]['on-another-date-year'],
                            +helpers.state.ancestors[0][
                              'on-another-date-month'
                            ],
                            +helpers.state.ancestors[0]['on-another-date-day']
                          )
                        ) {
                          return value
                        }

                        const dateOfTesting = new Date(
                          helpers.state.ancestors[0]['on-another-date-year'],
                          helpers.state.ancestors[0]['on-another-date-month'] -
                        1,
                          helpers.state.ancestors[0]['on-another-date-day']
                        )
                        const currentDate = new Date()
                        if (dateOfTesting > currentDate) {
                          return helpers.error('dateOfTesting.future')
                        }
                        const dateOfAgreementAccepted = new Date(
                          helpers.state.ancestors[0].dateOfAgreementAccepted
                        )
                        if (dateOfTesting < dateOfAgreementAccepted) {
                          return helpers.error('dateOfTesting.beforeAccepted', {
                            dateOfAgreementAccepted: new Date(
                              dateOfAgreementAccepted
                            ).toLocaleString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })
                          })
                        }
                        return value
                      },
                      {
                        'dateOfTesting.future':
                        'Date of testing must be in the past',
                        'dateOfTesting.beforeAccepted':
                        'Date of testing must be the same or after {#dateOfAgreementAccepted} when you accepted your agreement offer'
                      }
                    )
                  },
                  {
                    is: 'whenTheVetVisitedTheFarmToCarryOutTheReview',
                    then: Joi.allow('')
                  }
                ],
                otherwise: Joi.allow('')
              })
            })
          : Joi.object({
            dateOfAgreementAccepted: Joi.string().required(),

            [labels.day]: Joi.when('dateOfAgreementAccepted', {
              switch: [
                {
                  is: Joi.exist(),
                  then: validateDateInputDay(
                    'visit-date',
                    'Date of review'
                  ).messages({
                    'dateInputDay.ifNothingIsEntered':
                      'Enter the date the vet completed the review'
                  })
                }
              ]
            }),

            [labels.month]: Joi.when('dateOfAgreementAccepted', {
              switch: [
                {
                  is: Joi.exist(),
                  then: validateDateInputMonth(
                    'visit-date',
                    'Date of review'
                  )
                }
              ]
            }),

            [labels.year]: Joi.when('dateOfAgreementAccepted', {
              switch: [
                {
                  is: Joi.exist(),
                  then: validateDateInputYear(
                    'visit-date',
                    'Date of review',
                    (value, helpers) => {
                      if (value > 9999 || value < 1000) {
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
                      if (
                        !isValidDate(
                          +helpers.state.ancestors[0][labels.year],
                          +helpers.state.ancestors[0][labels.month],
                          +helpers.state.ancestors[0][labels.day]
                        )
                      ) {
                        return value
                      }

                      const dateOfReview = new Date(
                        Date.UTC(
                          helpers.state.ancestors[0][labels.year],
                          helpers.state.ancestors[0][labels.month] - 1,
                          helpers.state.ancestors[0][labels.day]
                        )
                      )

                      const currentDate = new Date()
                      const dateOfAgreementAccepted = new Date(
                        helpers.state.ancestors[0].dateOfAgreementAccepted
                      )

                      if (dateOfReview > currentDate) {
                        return helpers.error('dateOfReview.future')
                      }

                      if (dateOfReview < dateOfAgreementAccepted) {
                        return helpers.error('dateOfReview.beforeAccepted', {
                          dateOfAgreementAccepted: new Date(
                            dateOfAgreementAccepted
                          ).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        })
                      }

                      const endDate = new Date(dateOfAgreementAccepted)
                      endDate.setMonth(
                        endDate.getMonth() + config.claimExpiryTimeMonths
                      )
                      if (dateOfReview > endDate) {
                        return helpers.error('dateOfReview.expired')
                      }

                      return value
                    },
                    {
                      'dateOfReview.future':
                        'The date the review was completed must be in the past',
                      'dateOfReview.beforeAccepted':
                        'Date of review must be the same or after {#dateOfAgreementAccepted} when you accepted your agreement offer',
                      'dateOfReview.expired':
                        'The date the review was completed must be within six months of agreement date'
                    }
                  )
                }
              ]
            })
          }),
        failAction: async (request, h, error) => {
          request.logger.setBindings({ err: error })
          const errorSummary = []

          if (
            error.details
              .filter((e) => e.context.label.startsWith('visit-date'))
              .filter((e) => e.type.indexOf('ifTheDateIsIncomplete') !== -1)
              .length
          ) {
            error.details = error.details.filter(
              (e) =>
                !e.context.label.startsWith('visit-date') ||
                e.type.indexOf('ifTheDateIsIncomplete') !== -1
            )
          }
          if (
            error.details.filter((e) =>
              e.context.label.startsWith('visit-date')
            ).length
          ) {
            errorSummary.push({
              text: error.details.find((e) =>
                e.context.label.startsWith('visit-date')
              ).message,
              href: 'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
            })
          }

          if (
            error.details.find(
              (e) => e.context.label === 'whenTestingWasCarriedOut'
            )
          ) {
            errorSummary.push({
              text: error.details.find(
                (e) => e.context.label === 'whenTestingWasCarriedOut'
              ).message,
              href: 'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
            })
          }
          if (
            error.details
              .filter((e) => e.context.label.startsWith('on-another-date'))
              .filter((e) => e.type.indexOf('ifTheDateIsIncomplete') !== -1)
              .length
          ) {
            error.details = error.details.filter(
              (e) =>
                !e.context.label.startsWith('on-another-date') ||
                e.type.indexOf('ifTheDateIsIncomplete') !== -1
            )
          }
          if (
            error.details.filter((e) =>
              e.context.label.startsWith('on-another-date')
            ).length
          ) {
            errorSummary.push({
              text: error.details.find((e) =>
                e.context.label.startsWith('on-another-date')
              ).message,
              href: 'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
            })
          }

          return h
            .view(templatePath, {
              dateOfTestingEnabled: config.dateOfTesting.enabled,
              ...request.payload,
              errorSummary,
              dateOfReview: {
                day: {
                  value: request.payload['visit-date-day'],
                  error: error.details.find(
                    (e) =>
                      e.context.label === 'visit-date-day' ||
                      e.type.startsWith('dateOfReview')
                  )
                },
                month: {
                  value: request.payload['visit-date-month'],
                  error: error.details.find(
                    (e) =>
                      e.context.label === 'visit-date-month' ||
                      e.type.startsWith('dateOfReview')
                  )
                },
                year: {
                  value: request.payload['visit-date-year'],
                  error: error.details.find(
                    (e) =>
                      e.context.label === 'visit-date-year' ||
                      e.type.startsWith('dateOfReview')
                  )
                },
                errorMessage: error.details.find((e) =>
                  e.context.label.startsWith('visit-date')
                )
                  ? {
                      text: error.details.find((e) =>
                        e.context.label.startsWith('visit-date')
                      ).message
                    }
                  : undefined
              },
              whenTestingWasCarriedOut: config.dateOfTesting.enabled
                ? {
                    value: request.payload.whenTestingWasCarriedOut,
                    errorMessage: error.details.find(
                      (e) => e.context.label === 'whenTestingWasCarriedOut'
                    )
                      ? {
                          text: error.details.find(
                            (e) =>
                              e.context.label === 'whenTestingWasCarriedOut'
                          ).message
                        }
                      : undefined,
                    onAnotherDate: {
                      day: {
                        value: request.payload['on-another-date-day'],
                        error: error.details.find(
                          (e) =>
                            e.context.label === 'on-another-date-day' ||
                          e.type.startsWith('dateOfTesting')
                        )
                      },
                      month: {
                        value: request.payload['on-another-date-month'],
                        error: error.details.find(
                          (e) =>
                            e.context.label === 'on-another-date-month' ||
                          e.type.startsWith('dateOfTesting')
                        )
                      },
                      year: {
                        value: request.payload['on-another-date-year'],
                        error: error.details.find(
                          (e) =>
                            e.context.label === 'on-another-date-year' ||
                          e.type.startsWith('dateOfTesting')
                        )
                      },
                      errorMessage: error.details.find((e) =>
                        e.context.label.startsWith('on-another-date')
                      )
                        ? {
                            text: error.details.find((e) =>
                              e.context.label.startsWith('on-another-date')
                            ).message
                          }
                        : undefined
                    }
                  }
                : {}
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const dateOfReview = new Date(
          request.payload[labels.year],
          request.payload[labels.month] - 1,
          request.payload[labels.day]
        )
        session.setClaim(
          request,
          sessionKeys.farmerApplyData.visitDate,
          dateOfReview
        )

        if (config.dateOfTesting.enabled) {
          const dateOfTesting =
            request.payload.whenTestingWasCarriedOut ===
              'whenTheVetVisitedTheFarmToCarryOutTheReview'
              ? dateOfReview
              : new Date(
                request.payload['on-another-date-year'],
                request.payload['on-another-date-month'] - 1,
                request.payload['on-another-date-day']
              )
          session.setClaim(
            request,
            sessionKeys.farmerApplyData.dateOfTesting,
            dateOfTesting
          )
        }

        const claimType = session.getClaim(request)

        return !!claimType.data &&
          !!claimType.data.whichReview &&
          claimType.data.whichReview === 'dairy'
          ? h.redirect('/claim/vet-name')
          : h.redirect('/claim/animals-tested')
      }
    }
  }
]
