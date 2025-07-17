import Joi from 'joi'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import links from '../../config/routes.js'
import { config } from '../../config/index.js'
import { claimConstants } from '../../constants/claim.js'
import { resetEndemicsClaimSession } from '../../lib/context-helper.js'
import HttpStatus from 'http-status-codes'

const { livestockTypes } = claimConstants
const {
  claimDashboard,
  endemicsWhichSpecies,
  endemicsWhichTypeOfReview
} = links
const { urlPrefix } = config

const pageUrl = `${urlPrefix}/${endemicsWhichSpecies}`
const backLink = claimDashboard
const errorMessage = { text: 'Select which species you are claiming for' }
const view = `${endemicsWhichSpecies}`

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const endemicsClaim = getEndemicsClaim(request)
      return h.view(view, {
        ...(endemicsClaim?.typeOfLivestock && {
          previousAnswer: endemicsClaim.typeOfLivestock
        }),
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
        typeOfLivestock: Joi.string()
          .valid(...Object.values(livestockTypes))
          .required()
      }),
      failAction: (request, h, err) => {
        request.logger.setBindings({ err })
        return h
          .view(view, {
            errorMessage,
            backLink
          })
          .code(HttpStatus.BAD_REQUEST)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { typeOfLivestock } = request.payload
      const { typeOfLivestock: prevTypeOfLivestock, reference, latestEndemicsApplication } = getEndemicsClaim(request)

      if (typeOfLivestock !== prevTypeOfLivestock) {
        await resetEndemicsClaimSession(request, latestEndemicsApplication.reference, reference)
      }

      setEndemicsClaim(request, sessionKeys.endemicsClaim.typeOfLivestock, typeOfLivestock)

      return h.redirect(`${urlPrefix}/${endemicsWhichTypeOfReview}`)
    }
  }
}

export const whichSpeciesHandlers = [getHandler, postHandler]
