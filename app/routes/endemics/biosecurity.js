import Joi from 'joi'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { claimConstants } from '../../constants/claim.js'
import { getTestResult } from '../../lib/get-test-result.js'
import { getLivestockTypes } from '../../lib/get-livestock-types.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { isPIHuntEnabledAndVisitDateAfterGoLive } from '../../lib/context-helper.js'

const { biosecurity: biosecurityKey, dateOfVisit: dateOfVisitKey } = sessionKeys.endemicsClaim
const {
  urlPrefix,
  ruralPaymentsAgency
} = config
const {
  endemicsTestResults,
  endemicsBiosecurity,
  endemicsCheckAnswers,
  endemicsDiseaseStatus,
  endemicsBiosecurityException,
  endemicsVetRCVS,
  endemicsPIHunt,
  endemicsPIHuntRecommended,
  endemicsPIHuntAllAnimals
} = links
const { livestockTypes: { pigs } } = claimConstants

const pageUrl = `${urlPrefix}/${endemicsBiosecurity}`

export const isPIHuntValidPositive = (isPositive, piHuntDone, piHuntAllAnimals, dateOfVisit) => isPositive && piHuntDone && (isPIHuntEnabledAndVisitDateAfterGoLive(dateOfVisit) ? piHuntAllAnimals : true)
const isPIHuntValidNegative = (
  isNegative,
  piHuntDone,
  piHuntRecommended,
  piHuntAllAnimals
) => isNegative && piHuntDone && piHuntRecommended && piHuntAllAnimals
const isPIHuntValid = (
  isPositive,
  piHuntDone,
  piHuntAllAnimals,
  piHuntRecommended,
  isNegative,
  dateOfVisit
) =>
  isPIHuntValidPositive(isPositive, piHuntDone, piHuntAllAnimals, dateOfVisit) ||
  isPIHuntValidNegative(
    isNegative,
    piHuntDone,
    piHuntRecommended,
    piHuntAllAnimals
  )
export const getBeefOrDairyPage = (session, isNegative, isPositive) => {
  const piHuntDone = session?.piHunt === 'yes'
  const piHuntRecommended = session?.piHuntRecommended === 'yes'
  const piHuntAllAnimals = session?.piHuntAllAnimals === 'yes'

  if (isNegative) {
    if (!piHuntDone) return `${urlPrefix}/${endemicsPIHunt}`

    if (!piHuntRecommended) return `${urlPrefix}/${endemicsPIHuntRecommended}`
    if (piHuntRecommended && !piHuntAllAnimals) {
      return `${urlPrefix}/${endemicsPIHuntAllAnimals}`
    }
  }
  if (isPositive && piHuntDone && !piHuntAllAnimals) {
    return `${urlPrefix}/${endemicsPIHuntAllAnimals}`
  }
  if (
    isPIHuntValid(
      isPositive,
      piHuntDone,
      piHuntAllAnimals,
      piHuntRecommended,
      isNegative,
      session.dateOfVisit
    )
  ) {
    return `${urlPrefix}/${endemicsTestResults}`
  }

  return `${urlPrefix}/${endemicsTestResults}`
}
export const previousPageUrl = (request) => {
  const session = getEndemicsClaim(request)
  const { isNegative, isPositive } = getTestResult(session?.reviewTestResults)
  const { isBeef, isDairy, isPigs } = getLivestockTypes(
    session?.typeOfLivestock
  )
  const dateOfVisit = getEndemicsClaim(request, dateOfVisitKey)

  if ((isBeef || isDairy) && isPIHuntEnabledAndVisitDateAfterGoLive(dateOfVisit)) {
    return getBeefOrDairyPage(session, isNegative, isPositive)
  } else {
    if ((isBeef || isDairy) && isNegative) {
      return `${urlPrefix}/${endemicsVetRCVS}`
    }
    if (isPigs) return `${urlPrefix}/${endemicsDiseaseStatus}`

    return `${urlPrefix}/${endemicsTestResults}`
  }
}

export const getAssessmentPercentageErrorMessage = (
  biosecurity,
  assessmentPercentage
) => {
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

const getHandler = {
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
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        biosecurity: Joi.string().valid('yes', 'no').required().messages({ 'any.required': 'Select whether the vet did a biosecurity assessment' }),
        assessmentPercentage: Joi.when('biosecurity', {
          is: Joi.valid('yes'),
          then: Joi.string().pattern(/^(?!0$)(100|\d{1,2})$/)
        })
      }),
      failAction: (request, h, err) => {
        request.logger.setBindings({ err })
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

export const biosecurityHandlers = [getHandler, postHandler]
