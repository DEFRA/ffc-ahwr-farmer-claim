import Joi from 'joi'
import { config } from '../../config/index.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { radios } from '../models/form-component/radios.js'
import { sessionKeys } from '../../session/keys.js'
import links from '../../config/routes.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { clearPiHuntSessionOnChange } from '../../lib/clear-pi-hunt-session-on-change.js'
import { getAmount } from '../../api-requests/claim-service-api.js'
import HttpStatus from 'http-status-codes'

const { urlPrefix } = config
const { endemicsPIHuntRecommended, endemicsPIHunt, endemicsBiosecurity, endemicsPIHuntAllAnimals, endemicsPIHuntRecommendedException } = links
const { endemicsClaim: { piHuntRecommended: piHuntRecommendedKey } } = sessionKeys

const pageUrl = `${urlPrefix}/${endemicsPIHuntRecommended}`
const backLink = `${urlPrefix}/${endemicsPIHunt}`
const continueToBiosecurityURL = `${urlPrefix}/${endemicsBiosecurity}`

const questionText = 'Was the PI hunt recommended by the vet?'
const hintHtml = 'You can find this on the summary the vet gave you.'

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { piHuntRecommended } = getEndemicsClaim(request)
      const yesOrNoRadios = radios(questionText, 'piHuntRecommended', undefined, { hintHtml, inline: true })([{ value: 'yes', text: 'Yes', checked: piHuntRecommended === 'yes' }, { value: 'no', text: 'No', checked: piHuntRecommended === 'no' }])
      return h.view(endemicsPIHuntRecommended, { backLink, title: questionText, ...yesOrNoRadios })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        piHuntRecommended: Joi.string().valid('yes', 'no').required()
      }),
      failAction: async (request, h, _error) => {
        const { piHuntRecommended } = getEndemicsClaim(request)
        const errorText = 'Select yes if the vet recommended the PI hunt'
        const yesOrNoRadios = radios(questionText, 'piHuntRecommended', errorText, { hintHtml, inline: true })([{ value: 'yes', text: 'Yes', checked: piHuntRecommended === 'yes' }, { value: 'no', text: 'No', checked: piHuntRecommended === 'no' }])
        return h.view(endemicsPIHuntRecommended, {
          ...yesOrNoRadios,
          backLink,
          title: questionText,
          errorMessage: {
            text: errorText,
            href: '#piHuntRecommended'
          }
        }).code(HttpStatus.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      const { typeOfReview, reviewTestResults, typeOfLivestock, piHunt, piHuntRecommended: previousAnswer, dateOfVisit } = getEndemicsClaim(request)
      const { piHuntRecommended } = request.payload
      setEndemicsClaim(request, piHuntRecommendedKey, piHuntRecommended)

      if (piHuntRecommended === 'no') {
        const claimPaymentNoPiHunt = await getAmount({ type: typeOfReview, typeOfLivestock, reviewTestResults, piHunt, piHuntAllAnimals: 'no', dateOfVisit }, request.logger)
        raiseInvalidDataEvent(request, piHuntRecommendedKey, `Value ${piHuntRecommended} should be yes for PI hunt vet recommendation`)
        if (piHuntRecommended !== previousAnswer) {
          clearPiHuntSessionOnChange(request, 'piHuntRecommended')
        }

        return h.view(endemicsPIHuntRecommendedException, { claimPaymentNoPiHunt, continueClaimLink: continueToBiosecurityURL, backLink: pageUrl })
          .code(HttpStatus.BAD_REQUEST)
          .takeover()
      }

      return h.redirect(`${urlPrefix}/${endemicsPIHuntAllAnimals}`)
    }
  }
}

export const piHuntRecommendedHandlers = [getHandler, postHandler]
