const Joi = require('joi')
const { labels } = require('../config/visit-date')
const getDateInputErrors = require('../lib/visit-date/date-input-errors')
const { createItemsFromDate, createItemsFromPayload } = require('../lib/visit-date/date-input-items')
const session = require('../session')
const { farmerApplyData: { visitDate } } = require('../session/keys')
const errorMessages = require('../lib/error-messages')
const config = require('../../app/config')

const templatePath = 'vet-visit-date'
const path = `/claim/${templatePath}`

function getDateFromPayload (payload) {
  const day = payload[labels.day]
  const month = payload[labels.month]
  const year = payload[labels.year]
  return new Date(year, month - 1, day)
}

module.exports = [{
  method: 'GET',
  path,
  options: {
    handler: async (request, h) => {
      const date = session.getClaim(request, visitDate)
      const items = createItemsFromDate(new Date(date), false)
      return h.view(templatePath, { items })
    }
  }
}, {
  method: 'POST',
  path,
  options: {
    validate: {
      payload: Joi.object({
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

        whenCarriedOut: Joi.string()
          .valid('onAnotherDate', 'whenTheVetVisitedTheFarmToCarryOutTheReview')
          .required(),

        'on-another-date-day': Joi.number()
          .min(1)
          .when('on-another-date-month', {
            switch: [
              { is: 2, then: Joi.number().max(28) },
              { is: Joi.number().valid(4, 6, 9, 11), then: Joi.number().max(30), otherwise: Joi.number().max(31) }
            ]
          })
          .when('whenCarriedOut', {
            switch: [
              { is: 'onAnotherDate', then: Joi.required() },
              { is: 'whenTheVetVisitedTheFarmToCarryOutTheReview', then: Joi.allow('') }
            ],
            otherwise: Joi.allow('')
          }),

        'on-another-date-month': Joi.number()
          .min(1)
          .max(12)
          .when('whenCarriedOut', {
            switch: [
              { is: 'onAnotherDate', then: Joi.required() },
              { is: 'whenTheVetVisitedTheFarmToCarryOutTheReview', then: Joi.allow('') }
            ],
            otherwise: Joi.allow('')
          }),

        'on-another-date-year': Joi.number()
          .min(2022)
          .max(2024)
          .when('whenCarriedOut', {
            switch: [
              { is: 'onAnotherDate', then: Joi.required() },
              { is: 'whenTheVetVisitedTheFarmToCarryOutTheReview', then: Joi.allow('') }
            ],
            otherwise: Joi.allow('')
          })
      }),
      failAction: async (request, h, error) => {
        const { createdAt } = session.getClaim(request)
        const dateInputErrors = getDateInputErrors(
          error.details.filter(err => err.context.label.startsWith('visit-date')),
          request.payload,
          createdAt
        )
        const errors = []
        if (dateInputErrors.errorMessage?.text) {
          errors.push({
            text: dateInputErrors.errorMessage.text,
            href: '#when-was-the-review-completed'
          })
        }
        if (error.details.find(e => e.context.label === 'whenCarriedOut')) {
          errors.push({
            text: 'Select if testing was carried out when the vet visited the farm or on another date',
            href: '#when-was-endemic-disease-or-condition-testing-carried-out'
          })
        }
        if (error.details.filter(e => e.context.label.startsWith('on-another-date')).length) {
          errors.push({
            text: 'Enter a date',
            href: '#when-was-endemic-disease-or-condition-testing-carried-out'
          })
        }
        return h
          .view(templatePath, {
            ...request.payload,
            ...dateInputErrors,
            errors,
            whenCarriedOut: {
              value: request.payload.whenCarriedOut,
              errorMessage: error.details.find(e => e.context.label === 'whenCarriedOut')
                ? { text: 'Select if testing was carried out when the vet visited the farm or on another date' }
                : undefined
            },
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
                ? { text: 'Enter a date' }
                : undefined
            }
          })
          .code(400)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const application = session.getClaim(request)
      const applicationDate = new Date(new Date(application.createdAt).toDateString())
      let endDate = new Date(new Date(application.createdAt).toDateString())
      endDate = new Date(endDate.setMonth(endDate.getMonth() + config.claimExpiryTimeMonths))
      const date = getDateFromPayload(request.payload)
      if (date > new Date()) {
        const dateInputErrors = {
          errorMessage: { text: errorMessages.visitDate.todayOrPast },
          items: createItemsFromPayload(request.payload, true)
        }
        const errors = []
        if (dateInputErrors.errorMessage?.text) {
          errors.push({
            text: dateInputErrors.errorMessage.text,
            href: '#when-was-the-review-completed'
          })
        }
        return h.view(templatePath, {
          ...request.payload,
          ...dateInputErrors,
          errors,
          whenCarriedOut: {
            value: request.payload.whenCarriedOut
          },
          onAnotherDate: {
            day: {
              value: request.payload['on-another-date-day']
            },
            month: {
              value: request.payload['on-another-date-month']
            },
            year: {
              value: request.payload['on-another-date-year']
            }
          }
        }).code(400).takeover()
      }
      if (date > endDate || date < applicationDate) {
        const dateInputErrors = {
          errorMessage: { text: errorMessages.visitDate.shouldBeLessThan6MonthAfterAgreement },
          items: createItemsFromPayload(request.payload, true)
        }
        const errors = []
        if (dateInputErrors.errorMessage?.text) {
          errors.push({
            text: dateInputErrors.errorMessage.text,
            href: '#when-was-the-review-completed'
          })
        }
        return h.view(templatePath, {
          ...request.payload,
          ...dateInputErrors,
          errors,
          whenCarriedOut: {
            value: request.payload.whenCarriedOut
          },
          onAnotherDate: {
            day: {
              value: request.payload['on-another-date-day']
            },
            month: {
              value: request.payload['on-another-date-month']
            },
            year: {
              value: request.payload['on-another-date-year']
            }
          }
        }).code(400).takeover()
      }
      session.setClaim(request, visitDate, date)
      return h.redirect('/claim/vet-name')
    }
  }
}]
