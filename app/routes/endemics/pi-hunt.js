import Joi from 'joi'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'
import links from '../../config/routes.js'
import { getTestResult } from '../../lib/get-test-result.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { clearPiHuntSessionOnChange } from '../../lib/clear-pi-hunt-session-on-change.js'
import { isVisitDateAfterPIHuntAndDairyGoLive } from '../../lib/context-helper.js'
import HttpStatus from 'http-status-codes'
import { prefixUrl } from '../utils/page-utils.js'

const { endemicsClaim: { piHunt: piHuntKey, dateOfVisit: dateOfVisitKey } } = sessionKeys
const { endemicsVetRCVS, endemicsPIHunt, endemicsPIHuntException, endemicsBiosecurity, endemicsPIHuntAllAnimals, endemicsPIHuntRecommended, endemicsTestUrn } = links

const backLink = prefixUrl(endemicsVetRCVS)
const pageUrl = prefixUrl(endemicsPIHunt)
const errorMessageText = 'Select yes if a PI hunt was done'

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { piHunt: previousAnswer } = getEndemicsClaim(request)
      const titleText = isVisitDateAfterPIHuntAndDairyGoLive(getEndemicsClaim(request, dateOfVisitKey)) ? 'Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done?' : 'Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done on all animals in the herd?'
      return h.view(endemicsPIHunt, { titleText, backLink, previousAnswer })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        piHunt: Joi.string().valid('yes', 'no').required()
      }),
      failAction: (request, h, err) => {
        request.logger.setBindings({ err })
        const { piHunt: previousAnswer } = getEndemicsClaim(request)
        const titleText = isVisitDateAfterPIHuntAndDairyGoLive(getEndemicsClaim(request, dateOfVisitKey)) ? 'Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done?' : 'Was a persistently infected (PI) hunt for bovine viral diarrhoea (BVD) done on all animals in the herd?'
        return h.view(
          endemicsPIHunt,
          {
            titleText,
            backLink,
            previousAnswer,
            errorMessage: { text: errorMessageText, href: '#piHunt' }
          }
        )
          .code(HttpStatus.BAD_REQUEST)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { reviewTestResults, piHunt: previousAnswer } = getEndemicsClaim(request)
      const { isNegative, isPositive } = getTestResult(reviewTestResults)
      const answer = request.payload.piHunt
      const piHuntEnabledAndVisitDateAfterGoLive = isVisitDateAfterPIHuntAndDairyGoLive(getEndemicsClaim(request, dateOfVisitKey))

      setEndemicsClaim(request, piHuntKey, answer)

      if (answer === 'no') {
        raiseInvalidDataEvent(request, piHuntKey, `Value ${answer} is not equal to required value yes`)

        if (answer !== previousAnswer) {
          clearPiHuntSessionOnChange(request, 'piHunt')
        }

        if (piHuntEnabledAndVisitDateAfterGoLive && isNegative) {
          return h.redirect(prefixUrl(endemicsBiosecurity))
        }

        return h.view(endemicsPIHuntException, { backLink: pageUrl })
          .code(HttpStatus.BAD_REQUEST)
          .takeover()
      }

      if (piHuntEnabledAndVisitDateAfterGoLive && isPositive) {
        return h.redirect(prefixUrl(endemicsPIHuntAllAnimals))
      }
      if (piHuntEnabledAndVisitDateAfterGoLive && isNegative) {
        return h.redirect(prefixUrl(endemicsPIHuntRecommended))
      }

      return h.redirect(prefixUrl(endemicsTestUrn))
    }
  }
}

export const piHuntHandlers = [getHandler, postHandler]
