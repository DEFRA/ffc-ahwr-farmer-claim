const Joi = require('joi')
const { labels } = require('../config/visit-date')
const getDateInputErrors = require('../lib/visit-date/date-input-errors')
const { createItemsFromDate } = require('../lib/visit-date/date-input-items')
const session = require('../session')
const sessionKeys = require('../session/keys')
const config = require('../../app/config')

const templatePath = 'vet-visit-date'
const path = `/claim/${templatePath}`

function getDateOfReviewFromPayload (payload) {
  const day = payload[labels.day]
  const month = payload[labels.month]
  const year = payload[labels.year]
  return new Date(year, month - 1, day)
}

const validateDateOfReview = (value, helpers) => {
  const dateOfReview = getDateOfReviewFromPayload(value)
  const currentDate = new Date()
  const dateOfAgreementAccepted = new Date(value.dateOfAgreementAccepted)

  if (dateOfReview > currentDate) {
    return helpers.error('dateOfReview.future')
  }

  if (dateOfReview < dateOfAgreementAccepted) {
    return helpers.error('dateOfReview.beforeAccepted')
  }

  const endDate = new Date(dateOfAgreementAccepted)
  endDate.setMonth(endDate.getMonth() + config.claimExpiryTimeMonths)
  if (dateOfReview > endDate) {
    return helpers.error('dateOfReview.expired')
  }

  return value
}

module.exports = [{
  method: 'GET',
  path,
  options: {
    handler: async (request, h) => {
      const agreement = session.getClaim(request)
      const dateOfReview = session.getClaim(request, sessionKeys.farmerApplyData.visitDate)
      const dateOfTesting = session.getClaim(request, sessionKeys.farmerApplyData.dateOfTesting)

      return h.view(templatePath, {
        dateOfTestingEnabled: config.dateOfTesting.enabled,
        dateOfAgreementAccepted: agreement?.createdAt ? new Date(agreement.createdAt).toISOString() : undefined,
        items: createItemsFromDate(new Date(dateOfReview), false),
        whenTestingWasCarriedOut: config.dateOfTesting.enabled && dateOfReview
          ? {
              value: dateOfReview === dateOfTesting
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
          : {}
      })
    }
  }
}, {
  method: 'POST',
  path,
  options: {
    validate: {
      payload: config.dateOfTesting.enabled
        ? Joi.object({
            dateOfAgreementAccepted: Joi.string().required(),

            [labels.day]: Joi.number().min(1)
              .when(labels.month, {
                switch: [
                  { is: 2, then: Joi.number().max(28) },
                  { is: Joi.number().valid(4, 6, 9, 11), then: Joi.number().max(30), otherwise: Joi.number().max(31) }
                ]
              })
              .required(),
            [labels.month]: Joi.number().min(1).max(12).required(),
            [labels.year]: Joi.number().min(2022).max(2024).required(),

            whenTestingWasCarriedOut: Joi.string()
              .valid('whenTheVetVisitedTheFarmToCarryOutTheReview', 'onAnotherDate')
              .required(),

            'on-another-date-day': Joi.number()
              .when('whenTestingWasCarriedOut', {
                switch: [
                  {
                    is: 'onAnotherDate',
                    then: Joi
                      .number()
                      .min(1)
                      .when('on-another-date-month', {
                        switch: [
                          { is: 2, then: Joi.number().max(28) },
                          { is: Joi.number().valid(4, 6, 9, 11), then: Joi.number().max(30), otherwise: Joi.number().max(31) }
                        ]
                      })
                      .required()
                  },
                  { is: 'whenTheVetVisitedTheFarmToCarryOutTheReview', then: Joi.allow('') }
                ],
                otherwise: Joi.allow('')
              }),

            'on-another-date-month': Joi.number()
              .when('whenTestingWasCarriedOut', {
                switch: [
                  { is: 'onAnotherDate', then: Joi.number().min(1).max(12).required() },
                  { is: 'whenTheVetVisitedTheFarmToCarryOutTheReview', then: Joi.allow('') }
                ],
                otherwise: Joi.allow('')
              }),

            'on-another-date-year': Joi.number()
              .when('whenTestingWasCarriedOut', {
                switch: [
                  { is: 'onAnotherDate', then: Joi.number().min(2022).max(2024).required() },
                  { is: 'whenTheVetVisitedTheFarmToCarryOutTheReview', then: Joi.allow('') }
                ],
                otherwise: Joi.allow('')
              })
          }).custom(validateDateOfReview)
        : Joi.object({
          dateOfAgreementAccepted: Joi.string().required(),
          [labels.day]: Joi.number().min(1)
            .when(labels.month, {
              switch: [
                { is: 2, then: Joi.number().max(28) },
                { is: Joi.number().valid(4, 6, 9, 11), then: Joi.number().max(30), otherwise: Joi.number().max(31) }
              ]
            })
            .required(),
          [labels.month]: Joi.number().min(1).max(12).required(),
          [labels.year]: Joi.number().min(2022).max(2024).required()
        }).custom(validateDateOfReview),
      failAction: async (request, h, error) => {
        console.log(error.details)
        const { createdAt } = session.getClaim(request)
        const dateInputErrors = getDateInputErrors(
          error.details.filter(err => err.context.label.startsWith('visit-date')),
          request.payload,
          createdAt
        )
        const errorSummary = []
        if (dateInputErrors.errorMessage?.text) {
          errorSummary.push({
            text: dateInputErrors.errorMessage.text,
            href: '#when-was-the-review-completed'
          })
        }
        if (error.details.find(e => e.context.label === 'whenTestingWasCarriedOut')) {
          errorSummary.push({
            text: 'Select if testing was carried out when the vet visited the farm or on another date',
            href: '#when-was-endemic-disease-or-condition-testing-carried-out'
          })
        }
        if (error.details.filter(e => e.context.label.startsWith('on-another-date')).length) {
          errorSummary.push({
            text: error.details.filter(e => e.context.label.startsWith('on-another-date')).length === 3
              ? 'Enter a date'
              : 'Enter a date in the correct format',
            href: '#when-was-endemic-disease-or-condition-testing-carried-out'
          })
        }
        return h
          .view(templatePath, {
            dateOfTestingEnabled: config.dateOfTesting.enabled,
            ...request.payload,
            ...dateInputErrors,
            errorSummary,
            whenTestingWasCarriedOut: config.dateOfTesting.enabled
              ? {
                  value: request.payload.whenTestingWasCarriedOut,
                  errorMessage: error.details.find(e => e.context.label === 'whenTestingWasCarriedOut')
                    ? { text: 'Select if testing was carried out when the vet visited the farm or on another date' }
                    : undefined,
                  onAnotherDate: {
                    day: {
                      value: request.payload['on-another-date-day'],
                      error: error.details.find(e => e.context.label === 'on-another-date-day')
                    },
                    month: {
                      value: request.payload['on-another-date-month'],
                      error: error.details.find(e => e.context.label === 'on-another-date-month')
                    },
                    year: {
                      value: request.payload['on-another-date-year'],
                      error: error.details.find(e => e.context.label === 'on-another-date-year')
                    },
                    errorMessage: error.details.filter(e => e.context.label.startsWith('on-another-date')).length
                      ? {
                          text: error.details.filter(e => e.context.label.startsWith('on-another-date')).length === 3
                            ? 'Enter a date'
                            : 'Enter a date in the correct format'
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
      const dateOfReview = getDateOfReviewFromPayload(request.payload)
      session.setClaim(request, sessionKeys.farmerApplyData.visitDate, dateOfReview)

      if (config.dateOfTesting.enabled) {
        const dateOfTesting = request.payload.whenTestingWasCarriedOut === 'whenTheVetVisitedTheFarmToCarryOutTheReview'
          ? dateOfReview
          : new Date(
            request.payload['on-another-date-year'],
            request.payload['on-another-date-month'] - 1,
            request.payload['on-another-date-day']
          )
        session.setClaim(request, sessionKeys.farmerApplyData.dateOfTesting, dateOfTesting)
      }

      return h.redirect('/claim/vet-name')
    }
  }
}]
