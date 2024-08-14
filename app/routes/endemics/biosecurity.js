const Joi = require('joi')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { biosecurity: biosecurityKey } = require('../../session/keys').endemicsClaim
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')
const { urlPrefix, ruralPaymentsAgency, optionalPIHunt } = require('../../config')
const { endemicsTestResults, endemicsBiosecurity, endemicsCheckAnswers, endemicsDiseaseStatus, endemicsBiosecurityException, endemicsVetRCVS, endemicsPIHunt, endemicsPIHuntRecommended, endemicsPIHuntAllAnimals } = require('../../config/routes')
const { livestockTypes } = require('../../constants/claim')
const { getLivestockTypes } = require('../../lib/get-livestock-types')
const { getTestResult } = require('../../lib/get-test-result')

const pageUrl = `${urlPrefix}/${endemicsBiosecurity}`
const previousPageUrl = (request) => {
  const session = getEndemicsClaim(request)
  const { isBeef, isDairy, isPigs } = getLivestockTypes(session?.typeOfLivestock)
  const { isNegative, isPositive } = getTestResult(session?.reviewTestResults)

  const piHuntDone = session?.piHunt === 'yes'
  const piHuntRecommended = session?.piHuntRecommended === 'yes'
  const piHuntAllAnimals = session?.piHuntAllAnimals === 'yes'
  const piHuntValid = (isPositive && piHuntDone) || (isNegative && piHuntDone && piHuntRecommended && piHuntAllAnimals)

  if ((isBeef || isDairy) && optionalPIHunt.enabled) {
    switch (true) {
      case (isNegative && !piHuntDone):
        return `${urlPrefix}/${endemicsPIHunt}`
      case (isNegative && piHuntDone && !piHuntRecommended):
        return `${urlPrefix}/${endemicsPIHuntRecommended}`
      case (isNegative && piHuntDone && piHuntRecommended && !piHuntAllAnimals):
      case (isPositive && piHuntDone && !piHuntAllAnimals):
        return `${urlPrefix}/${endemicsPIHuntAllAnimals}`
      case piHuntValid:
        return `${urlPrefix}/${endemicsTestResults}`
    }
  } else {
    if ((isBeef || isDairy) && isNegative) return `${urlPrefix}/${endemicsVetRCVS}`
    if (isPigs) return `${urlPrefix}/${endemicsDiseaseStatus}`

    return `${urlPrefix}/${endemicsTestResults}`
  }
}

const getAssessmentPercentageErrorMessage = (biosecurity, assessmentPercentage) => {
  if (biosecurity === undefined) return

  switch (true) {
    case assessmentPercentage === '':
      return 'Enter the assessment percentage'
    case Number(assessmentPercentage) < 1:
      return 'The assessment percentage must be a number between 1 and 100'
    case Number(assessmentPercentage) > 100:
      return 'The assessment percentage must be a number between 1 and 100'
    default:
      return 'The assessment percentage can only include numbers'
  }
}

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const session = getEndemicsClaim(request)
        return h.view(endemicsBiosecurity, {
          previousAnswer: session?.biosecurity,
          typeOfLivestock: session?.typeOfLivestock,
          backLink: previousPageUrl(request)
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
          biosecurity: Joi.string().valid('yes', 'no').required().messages({
            'any.required': 'Select whether the vet did a biosecurity assessment'
          }),
          assessmentPercentage: Joi.when('biosecurity', {
            is: Joi.valid('yes'),
            then: Joi.string().pattern(/^(?!0$)(100|\d{1,2})$/)
          })
        }),
        failAction: (request, h, error) => {
          const session = getEndemicsClaim(request)
          const { biosecurity, assessmentPercentage } = request.payload
          const assessmentPercentageErrorMessage = getAssessmentPercentageErrorMessage(biosecurity, assessmentPercentage)

          const errorMessage = biosecurity
            ? { text: assessmentPercentageErrorMessage, href: '#assessmentPercentage' }
            : { text: 'Select whether the vet did a biosecurity assessment', href: '#biosecurity' }
          const errors = {
            errorMessage,
            radioErrorMessage: biosecurity === undefined ? { text: 'Select whether the vet did a biosecurity assessment', href: '#biosecurity' } : undefined,
            inputErrorMessage: assessmentPercentageErrorMessage ? { text: assessmentPercentageErrorMessage, href: '#assessmentPercentage' } : undefined
          }

          return h
            .view(endemicsBiosecurity, {
              backLink: previousPageUrl(request),
              typeOfLivestock: session?.typeOfLivestock,
              ...errors,
              previousAnswer: biosecurity
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { pigs } = livestockTypes
        const { typeOfLivestock } = getEndemicsClaim(request)
        const { biosecurity, assessmentPercentage } = request.payload
        setEndemicsClaim(request, biosecurityKey, typeOfLivestock === pigs ? { biosecurity, assessmentPercentage } : biosecurity)

        if (biosecurity === 'no') {
          raiseInvalidDataEvent(request, biosecurityKey, `Value ${biosecurity} is not equal to required value yes`)
          return h.view(endemicsBiosecurityException, { backLink: pageUrl, ruralPaymentsAgency }).code(400).takeover()
        }

        return h.redirect(`${urlPrefix}/${endemicsCheckAnswers}`)
      }
    }
  }
]
