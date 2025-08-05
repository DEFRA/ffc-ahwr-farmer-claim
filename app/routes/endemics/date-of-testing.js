import Joi from 'joi'
import { sessionKeys } from '../../session/keys.js'
import { claimConstants } from '../../constants/claim.js'
import links from '../../config/routes.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { getReviewType } from '../../lib/get-review-type.js'
import { getLivestockTypes } from '../../lib/get-livestock-types.js'
import { validateDateInputDay } from '../govuk-components/validate-date-input-day.js'
import { validateDateInputMonth } from '../govuk-components/validate-date-input-month.js'
import { validateDateInputYear } from '../govuk-components/validate-date-input-year.js'
import { isValidDate } from '../../lib/date-utils.js'
import { addError } from '../utils/validations.js'
import {
  getReviewWithinLast10Months,
  isDateOfTestingLessThanDateOfVisit
} from '../../api-requests/claim-service-api.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import {
  getReviewHerdId,
  isMultipleHerdsUserJourney,
  isVisitDateAfterPIHuntAndDairyGoLive
} from '../../lib/context-helper.js'
import { getHerdBackLink } from '../../lib/get-herd-back-link.js'
import { isWithin4MonthsBeforeOrAfterDateOfVisit } from '../../lib/date-of-testing-4-month-check.js'
import HttpStatus from 'http-status-codes'
import { prefixUrl } from '../utils/page-utils.js'
import { MAX_POSSIBLE_YEAR, MIN_POSSIBLE_YEAR } from '../../constants/constants.js'

const {
  endemicsClaim: { dateOfTesting: dateOfTestingKey, dateOfVisit: dateOfVisitKey }
} = sessionKeys
const { claimType } = claimConstants
const {
  endemicsDateOfVisit,
  endemicsDateOfTesting,
  endemicsSpeciesNumbers,
  endemicsDateOfTestingException,
  endemicsTestUrn,
  endemicsPIHuntAllAnimals
} = links

const pageUrl = prefixUrl(endemicsDateOfTesting)
const backLink = (request) => {
  const { typeOfLivestock, typeOfReview, dateOfVisit, previousClaims, latestEndemicsApplication } = getEndemicsClaim(request)
  const { isEndemicsFollowUp } = getReviewType(typeOfReview)
  const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)

  if (isVisitDateAfterPIHuntAndDairyGoLive(getEndemicsClaim(request, dateOfVisitKey)) && isEndemicsFollowUp && (isBeef || isDairy)) {
    return prefixUrl(endemicsPIHuntAllAnimals)
  }

  if (isMultipleHerdsUserJourney(dateOfVisit, latestEndemicsApplication.flags)) {
    return getHerdBackLink(typeOfLivestock, previousClaims)
  }

  return prefixUrl(endemicsDateOfVisit)
}
const optionSameReviewOrFollowUpDateText = (typeOfReview) => {
  const { isReview } = getReviewType(typeOfReview)
  const reviewOrFollowUpText = isReview ? 'review' : 'follow-up'
  return `When the vet last visited the farm for the ${reviewOrFollowUpText}`
}
const getTheQuestionAndHintText = (typeOfReview, typeOfLivestock) => {
  const { isEndemicsFollowUp } = getReviewType(typeOfReview)
  const { isSheep } = getLivestockTypes(typeOfLivestock)
  const reviewOrFollowUpText = isEndemicsFollowUp ? 'follow-up' : 'review'

  if (isEndemicsFollowUp && isSheep) {
    return {
      questionText: 'When were samples taken or sheep assessed?',
      questionHintText:
        'This is the last date samples were taken or sheep assessed for this follow-up. You can find it on the summary the vet gave you.'
    }
  }

  return {
    questionText: 'When were samples taken?',
    questionHintText: `This is the date samples were last taken for this ${reviewOrFollowUpText}. You can find it on the summary the vet gave you.`
  }
}

const onAnotherDateInputId = 'on-another-date'
const dateOfSamplingText = 'Date of sampling'

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const {
        dateOfVisit,
        dateOfTesting,
        latestEndemicsApplication,
        typeOfReview,
        typeOfLivestock
      } = getEndemicsClaim(request)
      const { questionText, questionHintText } = getTheQuestionAndHintText(
        typeOfReview,
        typeOfLivestock
      )
      return h.view(endemicsDateOfTesting, {
        optionSameReviewOrFollowUpDateText:
          optionSameReviewOrFollowUpDateText(typeOfReview),
        questionText,
        questionHintText,
        dateOfAgreementAccepted: new Date(latestEndemicsApplication.createdAt)
          .toISOString()
          .slice(0, 10),
        dateOfVisit,
        whenTestingWasCarriedOut: dateOfTesting
          ? {
              value:
              dateOfVisit === dateOfTesting
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
        backLink: backLink(request)
      })
    }
  }
}

const postHandler = {
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

        [`${onAnotherDateInputId}-day`]: Joi.when('whenTestingWasCarriedOut', {
          switch: [
            {
              is: 'onAnotherDate',
              then: validateDateInputDay(
                onAnotherDateInputId,
                dateOfSamplingText
              ).messages({
                'dateInputDay.ifNothingIsEntered':
                  'Enter the date samples were taken'
              })
            },
            {
              is: 'whenTheVetVisitedTheFarmToCarryOutTheReview',
              then: Joi.allow('')
            }
          ],
          otherwise: Joi.allow('')
        }),

        [`${onAnotherDateInputId}-month`]: Joi.when('whenTestingWasCarriedOut', {
          switch: [
            {
              is: 'onAnotherDate',
              then: validateDateInputMonth(
                onAnotherDateInputId,
                dateOfSamplingText
              )
            },
            {
              is: 'whenTheVetVisitedTheFarmToCarryOutTheReview',
              then: Joi.allow('')
            }
          ],
          otherwise: Joi.allow('')
        }),

        [`${onAnotherDateInputId}-year`]: Joi.when('whenTestingWasCarriedOut', {
          switch: [
            {
              is: 'onAnotherDate',
              then: validateDateInputYear(
                onAnotherDateInputId,
                dateOfSamplingText,
                (value, helpers) => {
                  if (value > MAX_POSSIBLE_YEAR || value < MIN_POSSIBLE_YEAR) { // revisit this in the refactor date validation ticket
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
                      +helpers.state.ancestors[0][`${onAnotherDateInputId}-year`],
                      +helpers.state.ancestors[0][`${onAnotherDateInputId}-month`],
                      +helpers.state.ancestors[0][`${onAnotherDateInputId}-day`]
                    )
                  ) {
                    return value
                  }

                  const dateOfTesting = new Date(
                    helpers.state.ancestors[0][`${onAnotherDateInputId}-year`],
                    helpers.state.ancestors[0][`${onAnotherDateInputId}-month`] - 1,
                    helpers.state.ancestors[0][`${onAnotherDateInputId}-day`]
                  )

                  const currentDate = new Date()
                  if (dateOfTesting > currentDate) {
                    return helpers.error('dateOfTesting.future')
                  }

                  const dateOfAgreementAccepted = new Date(
                    helpers.state.ancestors[0].dateOfAgreementAccepted
                  )
                  if (dateOfTesting < dateOfAgreementAccepted) {
                    return helpers.error('dateOfTesting.beforeAgreementDate', {
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
                    'The date samples were taken must be in the past',
                  'dateOfTesting.beforeAgreementDate':
                    'The date samples were taken must be the same as or after the date of your agreement'
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
      }),
      failAction: async (request, h, error) => {
        const { dateOfVisit, typeOfReview, typeOfLivestock } =
          getEndemicsClaim(request)
        const { questionText, questionHintText } = getTheQuestionAndHintText(
          typeOfReview,
          typeOfLivestock
        )

        const errorSummary = []
        if (
          error.details.find(
            (e) => e.context.label === 'whenTestingWasCarriedOut'
          )
        ) {
          errorSummary.push({
            text: error.details.find(
              (e) => e.context.label === 'whenTestingWasCarriedOut'
            ).message,
            href: '#whenTestingWasCarriedOut'
          })
        }

        const newError = addError(
          error,
          onAnotherDateInputId,
          'ifTheDateIsIncomplete',
          '#whenTestingWasCarriedOut'
        )
        if (Object.keys(newError).length > 0 && newError.constructor === Object) { errorSummary.push(newError) }

        const possibleErrorMessage = (labelStartsWith) => error.details.find(
          (e) => e.context.label.startsWith(labelStartsWith))?.message

        return h
          .view(endemicsDateOfTesting, {
            ...request.payload,
            dateOfVisit,
            errorSummary,
            questionText,
            questionHintText,
            optionSameReviewOrFollowUpDateText:
              optionSameReviewOrFollowUpDateText(typeOfReview),
            whenTestingWasCarriedOut: {
              value: request.payload.whenTestingWasCarriedOut,
              errorMessage: possibleErrorMessage('whenTestingWasCarriedOut'),
              onAnotherDate: {
                day: {
                  value: request.payload[`${onAnotherDateInputId}-day`],
                  error: error.details.find(
                    (e) =>
                      e.context.label === `${onAnotherDateInputId}-day` ||
                      e.type.startsWith('dateOfTesting')
                  )
                },
                month: {
                  value: request.payload[`${onAnotherDateInputId}-month`],
                  error: error.details.find(
                    (e) =>
                      e.context.label === `${onAnotherDateInputId}-month` ||
                      e.type.startsWith('dateOfTesting')
                  )
                },
                year: {
                  value: request.payload[`${onAnotherDateInputId}-year`],
                  error: error.details.find(
                    (e) =>
                      e.context.label === `${onAnotherDateInputId}-year` ||
                      e.type.startsWith('dateOfTesting')
                  )
                },
                errorMessage: possibleErrorMessage(onAnotherDateInputId)
              }
            },
            backLink: backLink(request)
          })
          .code(HttpStatus.BAD_REQUEST)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const {
        dateOfVisit,
        typeOfReview,
        typeOfLivestock,
        previousClaims,
        latestVetVisitApplication,
        herdId,
        tempHerdId
      } = getEndemicsClaim(request)
      const { isEndemicsFollowUp } = getReviewType(typeOfReview)
      const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)

      const dateOfTesting =
        request.payload.whenTestingWasCarriedOut ===
          'whenTheVetVisitedTheFarmToCarryOutTheReview'
          ? dateOfVisit
          : new Date(
            request.payload[`${onAnotherDateInputId}-year`],
            request.payload[`${onAnotherDateInputId}-month`] - 1,
            request.payload[`${onAnotherDateInputId}-day`]
          )

      if (!isWithin4MonthsBeforeOrAfterDateOfVisit(dateOfVisit, dateOfTesting)) {
        await raiseInvalidDataEvent(request, dateOfTestingKey, `${dateOfTesting} is outside of the recommended 4 month period from the date of visit ${dateOfVisit}`)
      }

      const reviewHerdId = getReviewHerdId({ herdId, tempHerdId })
      const previousReviewClaim = getReviewWithinLast10Months(
        dateOfVisit,
        previousClaims,
        latestVetVisitApplication,
        typeOfLivestock,
        reviewHerdId
      )

      if (
        typeOfReview === claimType.endemics &&
        previousReviewClaim &&
        isDateOfTestingLessThanDateOfVisit(
          previousReviewClaim.data.dateOfVisit,
          dateOfTesting
        )
      ) {
        const errorMessage =
          'You must do a review, including sampling, before you do the resulting follow-up.'
        const errorLink =
          'https://www.gov.uk/guidance/farmers-how-to-apply-for-funding-to-improve-animal-health-and-welfare#timing-of-reviews-and-follow-ups'
        raiseInvalidDataEvent(
          request,
          dateOfTestingKey,
          `Value ${dateOfTesting} is invalid. Error: ${errorMessage}`
        )
        return h
          .view(endemicsDateOfTestingException, {
            backLink: pageUrl,
            errorMessage,
            errorLink
          })
          .code(HttpStatus.BAD_REQUEST)
          .takeover()
      }

      setEndemicsClaim(request, dateOfTestingKey, dateOfTesting)

      if (isVisitDateAfterPIHuntAndDairyGoLive(getEndemicsClaim(request, dateOfVisitKey)) && isEndemicsFollowUp && (isBeef || isDairy)) {
        return h.redirect(prefixUrl(endemicsTestUrn))
      }

      return h.redirect(prefixUrl(endemicsSpeciesNumbers))
    }
  }
}

export const dateOfTestingHandlers = [getHandler, postHandler]
