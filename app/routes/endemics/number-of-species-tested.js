const Joi = require('joi')
const session = require('../../session')
const config = require('../../config')
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsSpeciesNumbers,
  endemicsNumberOfSpeciesTested,
  endemicsNumberOfSpeciesException,
  endemicsVetName,
  endemicsNumberOfSpeciesSheepException,
  endemicsNumberOfSpeciesPigsException
} = require('../../config/routes')
const {
  endemicsClaim: { numberAnimalsTested: numberAnimalsTestedKey }
} = require('../../session/keys')
const {
  thresholds: { numberOfSpeciesTested: numberOfSpeciesTestedThreshold }
} = require('../../constants/amounts')
const { getLivestockTypes } = require('../../lib/get-livestock-types')
const { getReviewType } = require('../../lib/get-review-type')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')
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
        session.getEndemicsClaim(request)

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
          session.getEndemicsClaim(request)
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
        session.getEndemicsClaim(request)
      const { isPigs, isSheep } = getLivestockTypes(typeOfLivestock)
      const { isEndemicsFollowUp } = getReviewType(typeOfReview)
      const threshold =
        numberOfSpeciesTestedThreshold[typeOfLivestock][typeOfReview]
      const isEligible =
        isPigs && isEndemicsFollowUp
          ? Number(numberAnimalsTested) === threshold
          : Number(numberAnimalsTested) >= threshold

      session.setEndemicsClaim(
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
        await raiseInvalidDataEvent(
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
        await raiseInvalidDataEvent(
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

      await raiseInvalidDataEvent(
        request,
        numberAnimalsTestedKey,
        `Value ${numberAnimalsTested} is less than required value ${threshold} for ${typeOfLivestock}`
      )
      return h
        .view(endemicsNumberOfSpeciesException, {
          backLink: pageUrl,
          piHuntEnabled: config.optionalPIHunt.enabled,
          ruralPaymentsAgency: config.ruralPaymentsAgency
        })
        .code(400)
        .takeover()
    }
  }
}

module.exports = { handlers: [getHandler, postHandler] }
