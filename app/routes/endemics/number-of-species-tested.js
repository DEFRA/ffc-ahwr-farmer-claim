import Joi from 'joi'
import { config } from '../../config/index.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { thresholds } from '../../constants/amounts.js'
import { sessionKeys } from '../../session/keys.js'
import links from '../../config/routes.js'
import { getReviewType } from '../../lib/get-review-type.js'
import { getLivestockTypes } from '../../lib/get-livestock-types.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { isVisitDateAfterPIHuntAndDairyGoLive } from '../../lib/context-helper.js'

const urlPrefix = config.urlPrefix
const {
  endemicsSpeciesNumbers,
  endemicsNumberOfSpeciesTested,
  endemicsNumberOfSpeciesException,
  endemicsVetName,
  endemicsNumberOfSpeciesSheepException,
  endemicsNumberOfSpeciesPigsException
} = links
const {
  endemicsClaim: { numberAnimalsTested: numberAnimalsTestedKey, dateOfVisit: dateOfVisitKey }
} = sessionKeys
const { numberOfSpeciesTested: numberOfSpeciesTestedThreshold } = thresholds
const pageUrl = `${urlPrefix}/${endemicsNumberOfSpeciesTested}`
const backLink = `${urlPrefix}/${endemicsSpeciesNumbers}`
const nextPageURL = `${urlPrefix}/${endemicsVetName}`

const getTheQuestionText = (typeOfLivestock, typeOfReview) => {
  const { isReview } = getReviewType(typeOfReview)
  const { isSheep, isDairy, isPigs } = getLivestockTypes(typeOfLivestock)

  const questionTextOne = 'How many animals were samples taken from?'
  const questionTextTwo =
    'How many animals were samples taken from or assessed?'
  const questionTextThree =
    'How many sheep were samples taken from or assessed?'

  if (isReview) {
    if (isDairy) return questionTextTwo
    return questionTextOne
  }

  if (isSheep) return questionTextThree
  if (isPigs) return questionTextOne

  return questionTextTwo
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { numberAnimalsTested, typeOfLivestock, typeOfReview } =
        getEndemicsClaim(request)

      return h.view(endemicsNumberOfSpeciesTested, {
        questionText: getTheQuestionText(typeOfLivestock, typeOfReview),
        numberAnimalsTested,
        backLink
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
        numberAnimalsTested: Joi.string()
          .pattern(/^\d+$/)
          .max(4)
          .required()
          .messages({
            'string.base': 'Enter the number of animals tested',
            'string.empty': 'Enter the number of animals tested',
            'string.max': 'The number of animals tested should not exceed 9999',
            'string.pattern.base':
              'The number of animals samples were taken from must only include numbers'
          })
      }),
      failAction: async (request, h, error) => {
        const { typeOfLivestock, typeOfReview } =
          getEndemicsClaim(request)
        return h
          .view(endemicsNumberOfSpeciesTested, {
            ...request.payload,
            backLink,
            questionText: getTheQuestionText(typeOfLivestock, typeOfReview),
            errorMessage: {
              text: error.details[0].message,
              href: `#${numberAnimalsTestedKey}`
            }
          })
          .code(400)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { numberAnimalsTested } = request.payload
      const { typeOfLivestock, typeOfReview } =
        getEndemicsClaim(request)
      const { isPigs, isSheep } = getLivestockTypes(typeOfLivestock)
      const { isEndemicsFollowUp } = getReviewType(typeOfReview)
      const threshold =
        numberOfSpeciesTestedThreshold[typeOfLivestock][typeOfReview]
      const isEligible =
        isPigs && isEndemicsFollowUp
          ? Number(numberAnimalsTested) === threshold
          : Number(numberAnimalsTested) >= threshold

      setEndemicsClaim(
        request,
        numberAnimalsTestedKey,
        numberAnimalsTested
      )

      if (isEligible) return h.redirect(nextPageURL)
      if (numberAnimalsTested === '0') {
        return h
          .view(endemicsNumberOfSpeciesTested, {
            ...request.payload,
            backLink,
            questionText: getTheQuestionText(typeOfLivestock, typeOfReview),
            errorMessage: {
              text: 'The number of animals tested cannot be 0',
              href: `#${numberAnimalsTestedKey}`
            }
          })
          .code(400)
          .takeover()
      }
      if (isPigs && isEndemicsFollowUp) {
        raiseInvalidDataEvent(
          request,
          numberAnimalsTestedKey,
          `Value ${numberAnimalsTested} is not equal to required value ${threshold} for ${typeOfLivestock}`
        )
        return h
          .view(endemicsNumberOfSpeciesPigsException, {
            ruralPaymentsAgency: config.ruralPaymentsAgency,
            continueClaimLink: nextPageURL,
            backLink: pageUrl
          })
          .code(400)
          .takeover()
      }
      if (isSheep) {
        raiseInvalidDataEvent(
          request,
          numberAnimalsTestedKey,
          `Value ${numberAnimalsTested} is less than required value ${threshold} for ${typeOfLivestock}`
        )
        return h
          .view(endemicsNumberOfSpeciesSheepException, {
            ruralPaymentsAgency: config.ruralPaymentsAgency,
            continueClaimLink: nextPageURL,
            backLink: pageUrl
          })
          .code(400)
          .takeover()
      }

      raiseInvalidDataEvent(
        request,
        numberAnimalsTestedKey,
        `Value ${numberAnimalsTested} is less than required value ${threshold} for ${typeOfLivestock}`
      )
      return h
        .view(endemicsNumberOfSpeciesException, {
          backLink: pageUrl,
          piHuntEnabled: isVisitDateAfterPIHuntAndDairyGoLive(getEndemicsClaim(request, dateOfVisitKey)),
          ruralPaymentsAgency: config.ruralPaymentsAgency
        })
        .code(400)
        .takeover()
    }
  }
}

export const numberOfSpeciesHandlers = [getHandler, postHandler]
