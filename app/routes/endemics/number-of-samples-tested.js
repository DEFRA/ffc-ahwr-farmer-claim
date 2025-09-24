import Joi from 'joi'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { sessionKeys } from '../../session/keys.js'
import links from '../../config/routes.js'
import { thresholds } from '../../constants/amounts.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { claimConstants } from '../../constants/claim.js'
import HttpStatus from 'http-status-codes'
import { prefixUrl } from '../utils/page-utils.js'

const {
  endemicsTestUrn,
  endemicsNumberOfSamplesTested,
  endemicsNumberOfSamplesTestedException,
  endemicsPigsPcrResult,
  endemicsPigsElisaResult
} = links
const {
  endemicsClaim: { numberOfSamplesTested: numberOfSamplesTestedKey, pigsFollowUpTest: pigsFollowUpTestKey }
} = sessionKeys
const { positiveReviewNumberOfSamplesTested, negativeReviewNumberOfSamplesTested } = thresholds

const pageUrl = prefixUrl(endemicsNumberOfSamplesTested)

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { numberOfSamplesTested } = getEndemicsClaim(request)

      return h.view(endemicsNumberOfSamplesTested, {
        numberOfSamplesTested,
        backLink: prefixUrl(endemicsTestUrn),
        hintText: 'Enter how many polymerase chain reaction (PCR) and enzyme-linked immunosorbent assay (ELISA) test results you got back. You can find this on the summary the vet gave you.'
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
        numberOfSamplesTested: Joi.string().pattern(/^\d+$/).max(4).required()
          .messages({
            'string.base': 'Enter how many samples were tested. Use the number of PCR or ELISA test results you got back',
            'string.empty': 'Enter how many samples were tested. Use the number of PCR or ELISA test results you got back',
            'string.max': 'The number of samples tested should not exceed 9999. Use the number of PCR or ELISA test results you got back',
            'string.pattern.base': 'The amount of samples tested must only include numbers. Use the number of PCR or ELISA test results you got back'
          })
      }),
      failAction: async (request, h, error) => {
        return h
          .view(endemicsNumberOfSamplesTested, {
            ...request.payload,
            errorMessage: { text: error.details[0].message, href: '#numberOfSamplesTested' },
            backLink: prefixUrl(endemicsTestUrn),
            hintText: 'Enter how many polymerase chain reaction (PCR) and enzyme-linked immunosorbent assay (ELISA) test results you got back. You can find this on the summary the vet gave you.'
          })
          .code(HttpStatus.BAD_REQUEST)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { numberOfSamplesTested } = request.payload
      setEndemicsClaim(request, numberOfSamplesTestedKey, numberOfSamplesTested)

      const endemicsClaim = getEndemicsClaim(request)
      // This has always been here - but would question if maybe we should be calling getReviewTestResultWithinLast10Months(request) rather than this.
      const lastReviewTestResults = endemicsClaim.vetVisitsReviewTestResults ?? endemicsClaim.relevantReviewForEndemics?.data?.testResults

      const threshold = lastReviewTestResults === 'positive' ? positiveReviewNumberOfSamplesTested : negativeReviewNumberOfSamplesTested

      if (numberOfSamplesTested !== threshold) {
        request.logger.info(`Value ${numberOfSamplesTested} is not equal to required value ${threshold}`)
        raiseInvalidDataEvent(request, numberOfSamplesTestedKey, `Value ${numberOfSamplesTested} is not equal to required value ${threshold}`)
        return h.view(endemicsNumberOfSamplesTestedException, { backLink: pageUrl })
          .code(HttpStatus.BAD_REQUEST).takeover()
      }

      const { herdVaccinationStatus } = endemicsClaim
      const { vaccination: { vaccinated }, pigsFollowUpTest: { pcr, elisa }, result: { positive } } = claimConstants

      if (herdVaccinationStatus === vaccinated) {
        setEndemicsClaim(request, pigsFollowUpTestKey, pcr, { shouldEmitEvent: false })
        return h.redirect(prefixUrl(endemicsPigsPcrResult))
      }

      if (lastReviewTestResults === positive) {
        setEndemicsClaim(request, pigsFollowUpTestKey, pcr, { shouldEmitEvent: false })
        return h.redirect(prefixUrl(endemicsPigsPcrResult))
      }

      setEndemicsClaim(request, pigsFollowUpTestKey, elisa, { shouldEmitEvent: false })
      return h.redirect(prefixUrl(endemicsPigsElisaResult))
    }
  }
}

export const numberOfSamplesTestedHandlers = [getHandler, postHandler]
