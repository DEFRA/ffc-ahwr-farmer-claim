const Joi = require('joi')
const { getMostRecentReviewDate } = require('../../api-requests/claim-service-api')
const { labels } = require('../../config/visit-date')
const session = require('../../session')
const config = require('../../../app/config')
const urlPrefix = require('../../config').urlPrefix
const { endemicsWhichSpecies, endemicsDateOfVisit, endemicsDateOfVisitException, endemicsDateOfTesting } = require('../../config/routes')
const {
  endemicsClaim: { dateOfVisit: dateOfVisitKey }
} = require('../../session/keys')
const validateDateInputDay = require('../govuk-components/validate-date-input-day')
const validateDateInputMonth = require('../govuk-components/validate-date-input-month')
const validateDateInputYear = require('../govuk-components/validate-date-input-year')

const pageUrl = `${urlPrefix}/${endemicsDateOfVisit}`
const backLink = `${urlPrefix}/${endemicsWhichSpecies}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { dateOfVisit, latestEndemicsApplication } = session.getEndemicsClaim(request)

        return h.view(endemicsDateOfVisit, {
          dateOfAgreementAccepted: new Date(latestEndemicsApplication.createdAt).toISOString().slice(0, 10),
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
          [labels.day]: Joi.when('dateOfAgreementAccepted', {
            switch: [
              {
                is: Joi.exist(),
                then: validateDateInputDay('visit-date', 'Date of visit').messages({
                  'dateInputDay.ifNothingIsEntered': 'Enter the date the vet completed the review'
                })
              }
            ]
          }),

          [labels.month]: Joi.when('dateOfAgreementAccepted', {
            switch: [
              { is: Joi.exist(), then: validateDateInputMonth('visit-date', 'Date of visit') }
            ]
          }),

          [labels.year]: Joi.when('dateOfAgreementAccepted', {
            switch: [
              {
                is: Joi.exist(),
                then: validateDateInputYear('visit-date', 'Date of visit', (value, helpers) => {
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
                  if (!isValidDate(
                    +helpers.state.ancestors[0][labels.year],
                    +helpers.state.ancestors[0][labels.month],
                    +helpers.state.ancestors[0][labels.day]
                  )) {
                    return value
                  }

                  const dateOfVisit = new Date(Date.UTC(
                    helpers.state.ancestors[0][labels.year],
                    helpers.state.ancestors[0][labels.month] - 1,
                    helpers.state.ancestors[0][labels.day]
                  ))

                  const currentDate = new Date()
                  const dateOfAgreementAccepted = new Date(helpers.state.ancestors[0].dateOfAgreementAccepted)

                  if (dateOfVisit > currentDate) {
                    return helpers.error('dateOfVisit.future')
                  }

                  if (dateOfVisit < dateOfAgreementAccepted) {
                    return helpers.error('dateOfVisit.beforeAccepted', {
                      dateOfAgreementAccepted: new Date(dateOfAgreementAccepted)
                        .toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                    })
                  }

                  return value
                }, {
                  'dateOfVisit.future': 'Date of visit must be a real date',
                  'dateOfVisit.beforeAccepted': 'Date of visit cannot be before the date your agreement began'
                })
              }
            ]
          })
        }),
        failAction: async (request, h, error) => {
          const errorSummary = []
          if (
            error.details
              .filter(e => e.context.label.startsWith('visit-date'))
              .filter(e => e.type.indexOf('ifTheDateIsIncomplete') !== -1)
              .length
          ) {
            error.details = error.details
              .filter(e => !e.context.label.startsWith('visit-date') || e.type.indexOf('ifTheDateIsIncomplete') !== -1)
          }
          if (error.details.filter(e => e.context.label.startsWith('visit-date')).length) {
            errorSummary.push({
              text: error.details.find(e => e.context.label.startsWith('visit-date')).message,
              href: '#when-was-the-review-completed'
            })
          }
          return h
            .view(endemicsDateOfVisit, {
              ...request.payload,
              errorSummary,
              dateOfVisit: {
                day: {
                  value: request.payload['visit-date-day'],
                  error: error.details.find(e => e.context.label === 'visit-date-day' || e.type.startsWith('dateOfVisit'))
                },
                month: {
                  value: request.payload['visit-date-month'],
                  error: error.details.find(e => e.context.label === 'visit-date-month' || e.type.startsWith('dateOfReview'))
                },
                year: {
                  value: request.payload['visit-date-year'],
                  error: error.details.find(e => e.context.label === 'visit-date-year' || e.type.startsWith('dateOfReview'))
                },
                errorMessage: error.details.find(e => e.context.label.startsWith('visit-date'))
                  ? { text: error.details.find(e => e.context.label.startsWith('visit-date')).message }
                  : undefined
              }
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const dateOfVisit = new Date(
          request.payload[labels.year],
          request.payload[labels.month] - 1,
          request.payload[labels.day]
        )

        const { latestVetVisitApplication, previousClaims } = session.getEndemicsClaim(request)
        const lastReviewDate = getMostRecentReviewDate(previousClaims, latestVetVisitApplication)

        if (lastReviewDate) {
          const tenMonthsSinceLastReview = new Date(lastReviewDate)
          tenMonthsSinceLastReview.setMonth(tenMonthsSinceLastReview.getMonth() + config.endemicsClaimExpiryTimeMonths)

          if (dateOfVisit < tenMonthsSinceLastReview) {
            return h.view(endemicsDateOfVisitException, { backLink: pageUrl, ruralPaymentsAgency: config.ruralPaymentsAgency }).code(400).takeover()
          }
        }

        session.setEndemicsClaim(request, dateOfVisitKey, dateOfVisit)
        return h.redirect(`${urlPrefix}/${endemicsDateOfTesting}`)
      }
    }
  }
]
