import Joi from 'joi'
import HttpStatus from 'http-status-codes'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'
import links from '../../config/routes.js'
import { prefixUrl } from '../utils/page-utils.js'
import { PIGS_SAMPLE_TYPES } from '../../constants/constants.js'

const { oralFluid, blood } = PIGS_SAMPLE_TYPES

const {
  endemicsTestUrn,
  endemicsTypeOfSamplesTaken,
  endemicsNumberOfOralFluidSamples,
  endemicsNumberOfBloodSamples
} = links
const {
  endemicsClaim: {
    typeOfSamplesTaken: typeOfSamplesTakenKey,
    numberOfOralFluidSamples: numberOfOralFluidSamplesKey,
    numberOfBloodSamples: numberOfBloodSamplesKey
  }
} = sessionKeys

const pageUrl = prefixUrl(endemicsTypeOfSamplesTaken)

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { typeOfSamplesTaken } = getEndemicsClaim(request)

      return h.view(endemicsTypeOfSamplesTaken, {
        previousAnswer: typeOfSamplesTaken,
        backLink: prefixUrl(endemicsTestUrn)
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
        typeOfSamplesTaken: Joi.string().valid(oralFluid, blood).required().messages({ 'any.required': 'Select what type of samples where taken' })
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        return h
          .view(endemicsTypeOfSamplesTaken, {
            ...request.payload,
            errorMessage: { text: err.details[0].message, href: `#${typeOfSamplesTakenKey}` },
            backLink: prefixUrl(endemicsTestUrn)
          })
          .code(HttpStatus.BAD_REQUEST)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { typeOfSamplesTaken: oldValue } = getEndemicsClaim(request)
      const { typeOfSamplesTaken } = request.payload

      setEndemicsClaim(request, typeOfSamplesTakenKey, typeOfSamplesTaken)

      // type of samples changed so reset oral fluid and blood
      if (typeOfSamplesTaken !== oldValue) {
        setEndemicsClaim(request, numberOfOralFluidSamplesKey, undefined, { shouldEmitEvent: false })
        setEndemicsClaim(request, numberOfBloodSamplesKey, undefined, { shouldEmitEvent: false })
      }

      const nextPage = (typeOfSamplesTaken === oralFluid) ? endemicsNumberOfOralFluidSamples : endemicsNumberOfBloodSamples
      return h.redirect(prefixUrl(nextPage))
    }
  }
}

export const typeOfSamplesTakenHandlers = [getHandler, postHandler]
