import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { getLivestockTypes } from '../../lib/get-livestock-types.js'
import { getReviewType } from '../../lib/get-review-type.js'
import { radios } from '../models/form-component/radios.js'

const { urlPrefix } = config
const {
  endemicsTestResults,
  endemicsCheckAnswers,
  endemicsTestUrn,
  endemicsDiseaseStatus,
  endemicsBiosecurity,
  endemicsNumberOfOralFluidSamples
} = links
const { endemicsClaim: { testResults: testResultsKey } } = sessionKeys

const pageUrl = `${urlPrefix}/${endemicsTestResults}`
const previousPageUrl = (request) => {
  const { typeOfLivestock, typeOfReview } = getEndemicsClaim(request)
  const { isBeef, isDairy, isSheep, isPigs } = getLivestockTypes(typeOfLivestock)
  const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)

  if (isEndemicsFollowUp) {
    if (isSheep) return `${urlPrefix}/${endemicsDiseaseStatus}`
    if (isBeef || isDairy) return `${urlPrefix}/${endemicsTestUrn}`
  }

  if (isReview) {
    if (isPigs) return `${urlPrefix}/${endemicsNumberOfOralFluidSamples}`
    if (isBeef || isDairy) return `${urlPrefix}/${endemicsTestUrn}`
  }
}
const nextPageURL = (request) => {
  const { typeOfLivestock, typeOfReview } = getEndemicsClaim(request)
  const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)
  const { isEndemicsFollowUp } = getReviewType(typeOfReview)

  if (isEndemicsFollowUp) {
    if (isBeef || isDairy) return `${urlPrefix}/${endemicsBiosecurity}`
  }

  return `${urlPrefix}/${endemicsCheckAnswers}`
}
const pageTitle = (request) => {
  const { typeOfReview } = getEndemicsClaim(request)
  const { isEndemicsFollowUp } = getReviewType(typeOfReview)
  return isEndemicsFollowUp ? 'What was the follow-up test result?' : 'What was the test result?'
}

const hintHtml = 'You can find this on the summary the vet gave you.'

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { testResults } = getEndemicsClaim(request)
      const positiveNegativeRadios = radios('', 'testResults', undefined, { hintHtml })([{ value: 'positive', text: 'Positive', checked: testResults === 'positive' }, { value: 'negative', text: 'Negative', checked: testResults === 'negative' }])
      return h.view(endemicsTestResults, { title: pageTitle(request), backLink: previousPageUrl(request), ...positiveNegativeRadios })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        testResults: Joi.string().valid('positive', 'negative').required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        const positiveNegativeRadios = radios('', 'testResults', 'Select a test result', { hintHtml })([{ value: 'positive', text: 'Positive' }, { value: 'negative', text: 'Negative' }])
        return h.view(endemicsTestResults, {
          ...request.payload,
          title: pageTitle(request),
          backLink: previousPageUrl(request),
          ...positiveNegativeRadios,
          errorMessage: {
            text: 'Select a test result',
            href: '#testResults'
          }
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { testResults } = request.payload

      setEndemicsClaim(request, testResultsKey, testResults)
      return h.redirect(nextPageURL(request))
    }
  }
}

export const testResultsHandlers = [getHandler, postHandler]
