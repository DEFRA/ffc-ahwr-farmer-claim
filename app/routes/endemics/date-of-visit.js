const Joi = require('joi')
const { isValidDateOfVisit, getReviewWithinLast10Months } = require('../../api-requests/claim-service-api')
const { livestockTypes, claimType, dateOfVetVisitExceptions } = require('../../constants/claim')
const { labels } = require('../../config/visit-date')
const session = require('../../session')
const config = require('../../../app/config')
const urlPrefix = require('../../config').urlPrefix
const { endemicsDateOfVisit, endemicsDateOfVisitException, endemicsDateOfTesting } = require('../../config/routes')
const {
  endemicsClaim: { dateOfVisit: dateOfVisitKey, relevantReviewForEndemics: relevantReviewForEndemicsKey }
} = require('../../session/keys')
const validateDateInputDay = require('../govuk-components/validate-date-input-day')
const validateDateInputMonth = require('../govuk-components/validate-date-input-month')
const validateDateInputYear = require('../govuk-components/validate-date-input-year')
const { addError } = require('../utils/validations')

const pageUrl = `${urlPrefix}/${endemicsDateOfVisit}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { dateOfVisit, landingPage, latestEndemicsApplication } = session.getEndemicsClaim(request)
        const backLink = landingPage

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
                  'dateOfVisit.future': 'Date of visit must be in the past',
                  'dateOfVisit.beforeAccepted': 'Date of visit cannot be before the date your agreement began'
                })
              }
            ]
          })
        }),
        failAction: async (request, h, error) => {
          const errorSummary = []
          const newError = addError(error, 'visit-date', 'ifTheDateIsIncomplete', '#when-was-the-review-completed')
          if (Object.keys(newError).length > 0 && newError.constructor === Object) errorSummary.push(newError)

          const { landingPage } = session.getEndemicsClaim(request)
          const backLink = landingPage

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
                  error: error.details.find(e => e.context.label === 'visit-date-month' || e.type.startsWith('dateOfVisit'))
                },
                year: {
                  value: request.payload['visit-date-year'],
                  error: error.details.find(e => e.context.label === 'visit-date-year' || e.type.startsWith('dateOfVisit'))
                },
                errorMessage: error.details.find(e => e.context.label.startsWith('visit-date'))
                  ? { text: error.details.find(e => e.context.label.startsWith('visit-date')).message }
                  : undefined
              },
              backLink
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { typeOfReview, previousClaims, latestVetVisitApplication, typeOfLivestock, organisation } = session.getEndemicsClaim(request)
        const formattedTypeOfLivestock = [livestockTypes.pigs, livestockTypes.sheep].includes(typeOfLivestock) ? typeOfLivestock : `${typeOfLivestock} cattle`

        const dateOfVisit = new Date(
          request.payload[labels.year],
          request.payload[labels.month] - 1,
          request.payload[labels.day]
        )
        const { isValid, reason } = isValidDateOfVisit(dateOfVisit, typeOfReview, previousClaims, latestVetVisitApplication)
        const content = { url: '#' }
        if (!isValid) {
          switch (reason) {
            case dateOfVetVisitExceptions.reviewWithin10:
              content.text = 'There must be at least 10 months between your annual health and welfare reviews.'
              break
            case dateOfVetVisitExceptions.rejectedReview:
              content.text = `${organisation?.name} - SBI ${organisation?.sbi} had a failed review claim for ${formattedTypeOfLivestock} in the last 10 months.`
              break
            case dateOfVetVisitExceptions.noReview:
              content.text = 'There must be no more than 10 months between your annual health and welfare reviews and endemic disease follow-ups.'
              break
            case dateOfVetVisitExceptions.endemicsWithin10:
              content.text = 'There must be at least 10 months between your endemics follow-ups.'
          }
          return h.view(endemicsDateOfVisitException, { backLink: pageUrl, content, ruralPaymentsAgency: config.ruralPaymentsAgency }).code(400).takeover()
        }

        if (typeOfReview === claimType.endemics) {
          session.setEndemicsClaim(request, relevantReviewForEndemicsKey, getReviewWithinLast10Months(dateOfVisit, previousClaims, latestVetVisitApplication))
        }

        session.setEndemicsClaim(request, dateOfVisitKey, dateOfVisit)
        return h.redirect(`${urlPrefix}/${endemicsDateOfTesting}`)
      }
    }
  }
]
