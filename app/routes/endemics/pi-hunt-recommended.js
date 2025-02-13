import Joi from 'joi'
import { config } from '../../config/index.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { radios } from '../models/form-component/radios.js'
import { sessionKeys } from '../../session/keys.js'
import links from '../../config/routes.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { clearPiHuntSessionOnChange } from '../../lib/clear-pi-hunt-session-on-change.js'
import { getAmount } from '../../api-requests/claim-service-api.js'

const { urlPrefix, ruralPaymentsAgency } = config
const { endemicsPIHuntRecommended, endemicsPIHunt, endemicsBiosecurity, endemicsPIHuntAllAnimals, endemicsPIHuntRecommendedException } = links
const { endemicsClaim: { piHuntRecommended: piHuntRecommendedKey } } = sessionKeys

const pageUrl = `${urlPrefix}/${endemicsPIHuntRecommended}`
const backLink = `${urlPrefix}/${endemicsPIHunt}`
const continueToBiosecurityURL = `${urlPrefix}/${endemicsBiosecurity}`

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { piHuntRecommended } = getEndemicsClaim(request)
      const yesOrNoRadios = radios('', 'piHuntRecommended', undefined, { inline: true })([{ value: 'yes', text: 'Yes', checked: piHuntRecommended === 'yes' }, { value: 'no', text: 'No', checked: piHuntRecommended === 'no' }])
      return h.view(endemicsPIHuntRecommended, { backLink, ...yesOrNoRadios })
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
        const errorText = 'Select if the vet recommended the PI hunt'
        const yesOrNoRadios = radios('', 'piHuntRecommended', errorText, { inline: true })([{ value: 'yes', text: 'Yes', checked: piHuntRecommended === 'yes' }, { value: 'no', text: 'No', checked: piHuntRecommended === 'no' }])
        return h.view(endemicsPIHuntRecommended, {
          ...yesOrNoRadios,
          backLink,
          errorMessage: {
            text: errorText,
            href: '#piHuntRecommended'
          }
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { typeOfReview, reviewTestResults, typeOfLivestock, piHunt, piHuntRecommended: previousAnswer } = getEndemicsClaim(request)
      const { piHuntRecommended } = request.payload
      setEndemicsClaim(request, piHuntRecommendedKey, piHuntRecommended)

      if (piHuntRecommended === 'no') {
        const claimPaymentNoPiHunt = await getAmount({ type: typeOfReview, typeOfLivestock, reviewTestResults, piHunt, piHuntAllAnimals: 'no' }, request.logger)
        raiseInvalidDataEvent(request, piHuntRecommendedKey, `Value ${piHuntRecommended} should be yes for PI hunt vet recommendation`)
        if (piHuntRecommended !== previousAnswer) {
          clearPiHuntSessionOnChange(request, 'piHuntRecommended')
        }

        return h.view(endemicsPIHuntRecommendedException, { claimPaymentNoPiHunt, ruralPaymentsAgency, continueClaimLink: continueToBiosecurityURL, backLink: pageUrl }).code(400).takeover()
      }

      return h.redirect(`${urlPrefix}/${endemicsPIHuntAllAnimals}`)
    }
  }
}

export const piHuntRecommendedHandlers = [getHandler, postHandler]
