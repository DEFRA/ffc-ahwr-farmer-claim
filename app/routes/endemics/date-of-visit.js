import Joi from 'joi'
import { sessionKeys } from '../../session/keys.js'
import { config } from '../../config/index.js'
import { claimConstants } from '../../constants/claim.js'
import links from '../../config/routes.js'
import { visitDate } from '../../config/visit-date.js'
import appInsights from 'applicationinsights'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import {
  getReviewTestResultWithinLast10Months,
  getReviewWithinLast10Months,
  isCattleEndemicsClaimForOldWorldReview,
  isValidDateOfVisit
} from '../../api-requests/claim-service-api.js'
import { validateDateInputDay } from '../govuk-components/validate-date-input-day.js'
import { validateDateInputMonth } from '../govuk-components/validate-date-input-month.js'
import { validateDateInputYear } from '../govuk-components/validate-date-input-year.js'
import { getLivestockTypes } from '../../lib/get-livestock-types.js'
import { getReviewType } from '../../lib/get-review-type.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { addError } from '../utils/validations.js'

const { dateOfVetVisitExceptions } = claimConstants
const {
  endemicsClaim: {
    reviewTestResults: reviewTestResultsKey,
    dateOfVisit: dateOfVisitKey,
    relevantReviewForEndemics: relevantReviewForEndemicsKey
  }
} = sessionKeys

const { optionalPIHunt, urlPrefix } = config
const {
  endemicsDateOfVisit,
  endemicsDateOfVisitException,
  endemicsDateOfTesting,
  endemicsVetVisitsReviewTestResults,
  endemicsSpeciesNumbers
} = links

const { labels } = visitDate

const pageUrl = `${urlPrefix}/${endemicsDateOfVisit}`
const previousPageUrl = (request) => {
  const { landingPage } = getEndemicsClaim(request)

  if (isCattleEndemicsClaimForOldWorldReview(request)) { return `${urlPrefix}/${endemicsVetVisitsReviewTestResults}` }

  return landingPage
}

const isValidDateInput = (request, reviewOrFollowUpText) => {
  const dateModel = Joi.object({
    dateOfAgreementAccepted: Joi.string().required(),
    [labels.day]: Joi.when('dateOfAgreementAccepted', {
      switch: [
        {
          is: Joi.exist(),
          then: validateDateInputDay(
            'visit-date',
            `The date of ${reviewOrFollowUpText}`
          ).messages({
            'dateInputDay.ifNothingIsEntered': `Enter the date of ${reviewOrFollowUpText}`
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
            `The date of ${reviewOrFollowUpText}`
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
            `The date of ${reviewOrFollowUpText}`,
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

              const dateOfVisit = new Date(
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

              if (dateOfVisit > currentDate) {
                return helpers.error('dateOfVisit.future')
              }

              if (dateOfVisit < dateOfAgreementAccepted) {
                return helpers.error('dateOfVisit.beforeAccepted', {
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
              'dateOfVisit.future': `The date of ${reviewOrFollowUpText} must be in the past`,
              'dateOfVisit.beforeAccepted': `The date of ${reviewOrFollowUpText} cannot be before the date your agreement began`
            }
          )
        }
      ]
    })
  })

  let data
  const { error } = dateModel.validate(request.payload)
  if (error) {
    const errorSummary = []
    const newError = addError(
      error,
      'visit-date',
      'ifTheDateIsIncomplete',
      'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
    )
    if (Object.keys(newError).length > 0 && newError.constructor === Object) { errorSummary.push(newError) }

    data = error
      ? {
          ...request.payload,
          reviewOrFollowUpText,
          errorSummary,
          dateOfVisit: {
            day: {
              value: request.payload['visit-date-day'],
              error: error.details.find(
                (e) =>
                  e.context.label === 'visit-date-day' ||
                e.type.startsWith('dateOfVisit')
              )
            },
            month: {
              value: request.payload['visit-date-month'],
              error: error.details.find(
                (e) =>
                  e.context.label === 'visit-date-month' ||
                e.type.startsWith('dateOfVisit')
              )
            },
            year: {
              value: request.payload['visit-date-year'],
              error: error.details.find(
                (e) =>
                  e.context.label === 'visit-date-year' ||
                e.type.startsWith('dateOfVisit')
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
          backLink: previousPageUrl(request)
        }
      : {}
  }
  return { error, data }
}

const getMessage = (
  reason,
  dateOfVetVisitExceptions,
  organisation,
  formattedTypeOfLivestock
) => {
  const mainMessage = {}
  let backToPageMessage =
    'Enter the date the vet last visited your farm for this review.'
  switch (reason) {
    case dateOfVetVisitExceptions.reviewWithin10:
      mainMessage.text =
        'There must be at least 10 months between your reviews.'
      mainMessage.url =
        'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
      break
    case dateOfVetVisitExceptions.rejectedReview:
      mainMessage.text = `${organisation?.name} - SBI ${organisation?.sbi} had a failed review claim for ${formattedTypeOfLivestock} in the last 10 months.`
      break
    case dateOfVetVisitExceptions.noReview:
      mainMessage.text =
        'There must be no more than 10 months between your reviews and follow-ups.'
      mainMessage.url =
        'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
      backToPageMessage =
        'Enter the date the vet last visited your farm for this follow-up.'
      break
    case dateOfVetVisitExceptions.endemicsWithin10:
      mainMessage.text =
        'There must be at least 10 months between your follow-ups.'
      mainMessage.url =
        'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
      backToPageMessage =
        'Enter the date the vet last visited your farm for this follow-up.'
      break
    case dateOfVetVisitExceptions.claimEndemicsBeforeReviewPayment:
      mainMessage.text =
        'Your review claim must have been approved before you claim for the follow-up that happened after it.'
      mainMessage.url =
        'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
      backToPageMessage =
        'Enter the date the vet last visited your farm for this follow-up.'
      break
  }

  return { mainMessage, backToPageMessage }
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { dateOfVisit, latestEndemicsApplication, typeOfReview } =
        getEndemicsClaim(request)
      const { isReview } = getReviewType(typeOfReview)
      const reviewOrFollowUpText = isReview ? 'review' : 'follow-up'

      return h.view(endemicsDateOfVisit, {
        dateOfAgreementAccepted: new Date(latestEndemicsApplication.createdAt)
          .toISOString()
          .slice(0, 10),
        reviewOrFollowUpText,
        dateOfVisit: {
          day: {
            value: dateOfVisit ? new Date(dateOfVisit).getDate() : ''
          },
          month: {
            value: dateOfVisit ? new Date(dateOfVisit).getMonth() + 1 : ''
          },
          year: {
            value: dateOfVisit ? new Date(dateOfVisit).getFullYear() : ''
          }
        },
        backLink: previousPageUrl(request)
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
        typeOfReview,
        previousClaims,
        latestVetVisitApplication,
        typeOfLivestock,
        organisation,
        reviewTestResults,
        reference: tempClaimReference
      } = getEndemicsClaim(request)
      const { isBeef, isDairy, isPigs, isSheep } =
        getLivestockTypes(typeOfLivestock)
      const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)
      const reviewOrFollowUpText = isReview ? 'review' : 'follow-up'

      const { error, data } = isValidDateInput(request, reviewOrFollowUpText)
      if (error) {
        appInsights.defaultClient.trackEvent({
          name: 'claim-invalid-date-of-visit',
          properties: {
            tempClaimReference,
            dateOfAgreement: data.dateOfAgreementAccepted,
            dateEntered: `${data['visit-date-year']}-${data['visit-date-month']}-${data['visit-date-day']}`,
            journeyType: reviewOrFollowUpText,
            error: error.message
          }
        })
        return h.view(endemicsDateOfVisit, data).code(400).takeover()
      }

      const formattedTypeOfLivestock =
        isPigs || isSheep ? typeOfLivestock : `${typeOfLivestock} cattle`
      const dateOfVisit = new Date(
        request.payload[labels.year],
        request.payload[labels.month] - 1,
        request.payload[labels.day]
      )
      const { isValid, reason } = isValidDateOfVisit(
        dateOfVisit,
        typeOfReview,
        previousClaims,
        latestVetVisitApplication
      )

      if (!isValid) {
        const { mainMessage, backToPageMessage } = getMessage(
          reason,
          dateOfVetVisitExceptions,
          organisation,
          formattedTypeOfLivestock
        )
        raiseInvalidDataEvent(
          request,
          dateOfVisitKey,
          `Value ${dateOfVisit} is invalid. Error: ${mainMessage.text}`
        )
        return h
          .view(endemicsDateOfVisitException, {
            backLink: pageUrl,
            mainMessage,
            ruralPaymentsAgency: config.ruralPaymentsAgency,
            backToPageMessage
          })
          .code(400)
          .takeover()
      }

      if (isEndemicsFollowUp) {
        setEndemicsClaim(
          request,
          relevantReviewForEndemicsKey,
          getReviewWithinLast10Months(
            dateOfVisit,
            previousClaims,
            latestVetVisitApplication,
            typeOfLivestock
          )
        )
      }

      setEndemicsClaim(request, dateOfVisitKey, dateOfVisit)

      if ((isBeef || isDairy || isPigs) && isEndemicsFollowUp) {
        const reviewTestResultsValue =
          reviewTestResults ?? getReviewTestResultWithinLast10Months(request)
        setEndemicsClaim(
          request,
          reviewTestResultsKey,
          reviewTestResultsValue
        )

        if (
          (isBeef || isDairy) &&
          (optionalPIHunt.enabled || reviewTestResultsValue === 'negative')
        ) { return h.redirect(`${urlPrefix}/${endemicsSpeciesNumbers}`) }
      }
      return h.redirect(`${urlPrefix}/${endemicsDateOfTesting}`)
    }
  }
}

export const dateOfVisitHandlers = [getHandler, postHandler]
