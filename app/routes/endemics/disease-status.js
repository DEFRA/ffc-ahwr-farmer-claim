import Joi from 'joi'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { claimConstants } from '../../constants/claim.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import HttpStatus from 'http-status-codes'
import { prefixUrl } from '../utils/page-utils.js'

const {
  endemicsDiseaseStatus,
  endemicsNumberOfSamplesTested,
  endemicsBiosecurity
} = links
const { endemicsClaim } = sessionKeys
const { diseaseStatusTypes } = claimConstants

const pageUrl = prefixUrl(endemicsDiseaseStatus)
const backLink = prefixUrl(endemicsNumberOfSamplesTested)
const errorMessage = { text: 'Enter the disease status category' }

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const endemicsClaimData = getEndemicsClaim(request)
      return h.view(endemicsDiseaseStatus, {
        ...(endemicsClaimData?.diseaseStatus && {
          previousAnswer: endemicsClaimData.diseaseStatus
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
        diseaseStatus: Joi.string()
          .valid(...Object.values(diseaseStatusTypes))
          .required()
      }),
      failAction: (request, h, _err) => {
        return h
          .view(endemicsDiseaseStatus, {
            errorMessage,
            backLink
          })
          .code(HttpStatus.BAD_REQUEST)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { diseaseStatus } = request.payload

      setEndemicsClaim(request, endemicsClaim.diseaseStatus, diseaseStatus)
      return h.redirect(prefixUrl(endemicsBiosecurity))
    }
  }
}

export const diseaseStatusHandlers = [getHandler, postHandler]
