import Joi from 'joi'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import links from '../../config/routes.js'
import { config } from '../../config/index.js'
import { claimConstants } from '../../constants/claim.js'

const { livestockTypes } = claimConstants
const {
  claimDashboard,
  endemicsWhichSpecies,
  endemicsDateOfVisit
} = links
const { urlPrefix } = config

const pageUrl = `${urlPrefix}/${endemicsWhichSpecies}`
const backLink = claimDashboard
const errorMessage = { text: 'Select which species you are claiming for' }

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const endemicsClaimData = getEndemicsClaim(request)

      // TODO AHWR-15 update backLink, check for query parameter?
      // we're wanting to go to a world where the order is the same always in MS, so we probably won;t need to mess around with back link

      return h.view(endemicsWhichSpecies, {
        ...(endemicsClaimData?.typeOfLivestock && {
          previousAnswer: endemicsClaimData.typeOfLivestock
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
          .view(endemicsWhichSpecies, {
            errorMessage,
            backLink
          })
          .code(400)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { typeOfLivestock } = request.payload

      setEndemicsClaim(request, sessionKeys.endemicsClaim.typeOfLivestock, typeOfLivestock)
      // not sure we should be setting this here, but for now will keep it so as not to disrupt current flows
      setEndemicsClaim(request, sessionKeys.endemicsClaim.typeOfReview, claimConstants.claimType.review)

      return h.redirect(`${urlPrefix}/${endemicsDateOfVisit}`)
    }
  }
}

export const whichSpeciesHandlers = [getHandler, postHandler]
