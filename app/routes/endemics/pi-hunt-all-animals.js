import Joi from 'joi'
import { config } from '../../config/index.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { radios } from '../models/form-component/radios.js'
import { sessionKeys } from '../../session/keys.js'
import links from '../../config/routes.js'
import { getTestResult } from '../../lib/get-test-result.js'
import { getLivestockTypes } from '../../lib/get-livestock-types.js'
import { getAmount } from '../../api-requests/claim-service-api.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { clearPiHuntSessionOnChange } from '../../lib/clear-pi-hunt-session-on-change.js'
import HttpStatus from 'http-status-codes'

const { urlPrefix } = config
const { endemicsPIHuntRecommended, endemicsDateOfTesting, endemicsPIHuntAllAnimals, endemicsPIHunt, endemicsPIHuntAllAnimalsException, endemicsBiosecurity } = links
const { endemicsClaim: { piHuntAllAnimals: piHuntAllAnimalsKey } } = sessionKeys

const pageUrl = `${urlPrefix}/${endemicsPIHuntAllAnimals}`
const backLink = (reviewTestResults) => {
  const { isPositive } = getTestResult(reviewTestResults)
  return isPositive ? `${urlPrefix}/${endemicsPIHunt}` : `${urlPrefix}/${endemicsPIHuntRecommended}`
}
const continueToBiosecurityURL = `${urlPrefix}/${endemicsBiosecurity}`
const getLivestockText = (typeOfLivestock) => {
  const { isBeef } = getLivestockTypes(typeOfLivestock)
  return isBeef ? 'beef' : 'dairy'
}
const getQuestionText = (typeOfLivestock) => `Was the PI hunt done on all ${getLivestockText(typeOfLivestock)} cattle in the herd?`
const hintHtml = 'You can find this on the summary the vet gave you.'

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { typeOfLivestock, piHuntAllAnimals, reviewTestResults } = getEndemicsClaim(request)
      const questionText = getQuestionText(typeOfLivestock)
      const yesOrNoRadios = radios(questionText, 'piHuntAllAnimals', undefined, { hintHtml, inline: true })([{ value: 'yes', text: 'Yes', checked: piHuntAllAnimals === 'yes' }, { value: 'no', text: 'No', checked: piHuntAllAnimals === 'no' }])
      return h.view(endemicsPIHuntAllAnimals, { backLink: backLink(reviewTestResults), title: questionText, ...yesOrNoRadios })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        piHuntAllAnimals: Joi.string().valid('yes', 'no').required()
      }),
      failAction: async (request, h, _error) => {
        const { typeOfLivestock, piHuntAllAnimals, reviewTestResults } = getEndemicsClaim(request)
        const errorText = `Select yes if the PI hunt was done on all ${getLivestockText(typeOfLivestock)} cattle in the herd`
        const questionText = getQuestionText(typeOfLivestock)
        const yesOrNoRadios = radios(questionText, 'piHuntAllAnimals', errorText, { hintHtml, inline: true })([{ value: 'yes', text: 'Yes', checked: piHuntAllAnimals === 'yes' }, { value: 'no', text: 'No', checked: piHuntAllAnimals === 'no' }])

        return h.view(endemicsPIHuntAllAnimals, {
          ...yesOrNoRadios,
          backLink: backLink(reviewTestResults),
          title: questionText,
          errorMessage: {
            text: errorText,
            href: '#piHuntAllAnimals'
          }
        }).code(HttpStatus.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      const { typeOfReview, reviewTestResults, typeOfLivestock, piHunt, piHuntAllAnimals: previousAnswer, dateOfVisit } = getEndemicsClaim(request)
      const { piHuntAllAnimals } = request.payload

      setEndemicsClaim(request, piHuntAllAnimalsKey, piHuntAllAnimals)

      if (piHuntAllAnimals === 'no') {
        const livestockText = getLivestockText(typeOfLivestock)
        const claimPaymentNoPiHunt = await getAmount({ type: typeOfReview, typeOfLivestock, reviewTestResults, piHunt, piHuntAllAnimals: 'no', dateOfVisit }, request.logger)
        raiseInvalidDataEvent(request, piHuntAllAnimalsKey, `Value ${piHuntAllAnimalsKey} should be yes for PI hunt all cattle tested`)

        if (piHuntAllAnimals !== previousAnswer) {
          clearPiHuntSessionOnChange(request, 'piHuntAllAnimals')
        }

        return h.view(endemicsPIHuntAllAnimalsException, { reviewTestResults, claimPaymentNoPiHunt, livestockText, continueClaimLink: continueToBiosecurityURL, backLink: pageUrl })
          .code(HttpStatus.BAD_REQUEST).takeover()
      }

      return h.redirect(`${urlPrefix}/${endemicsDateOfTesting}`)
    }
  }
}

export const piHuntAllAnimalsHandlers = [getHandler, postHandler]
