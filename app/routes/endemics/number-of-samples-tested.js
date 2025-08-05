import Joi from 'joi'
import { config } from '../../config/index.js'
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
  endemicsDiseaseStatus,
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

      let hintText = 'You can find this on the summary the vet gave you.'

      if (config.pigUpdates.enabled) {
        hintText = 'Enter how many polymerase chain reaction (PCR) and enzyme-linked immunosorbent assay (ELISA) test results you got back. You can find this on the summary the vet gave you.'
      }

      return h.view(endemicsNumberOfSamplesTested, {
        numberOfSamplesTested,
        backLink: prefixUrl(endemicsTestUrn),
        hintText
      })
    }
  }
}

const getUpdatedErrorMessage = (errorMessage) => {
  if (config.pigUpdates.enabled) {
    const pigUpdatesErrorMessageMap = {
      'Enter the number of samples tested': 'Enter how many samples were tested. Use the number of PCR or ELISA test results you got back',
      'The number of samples tested should not exceed 9999': 'The number of samples tested should not exceed 9999. Use the number of PCR or ELISA test results you got back',
      'The amount of samples tested must only include numbers': 'The amount of samples tested must only include numbers. Use the number of PCR or ELISA test results you got back'
    }

    return pigUpdatesErrorMessageMap[errorMessage]
  }

  return errorMessage
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        numberOfSamplesTested: Joi.string().pattern(/^\d+$/).max(4).required()
          .messages({
            'string.base': 'Enter the number of samples tested',
            'string.empty': 'Enter the number of samples tested',
            'string.max': 'The number of samples tested should not exceed 9999',
            'string.pattern.base': 'The amount of samples tested must only include numbers'
          })
      }),
      failAction: async (request, h, error) => {
        const newErrorMessage = getUpdatedErrorMessage(error.details[0].message)

        let hintText = 'You can find this on the summary the vet gave you.'

        if (config.pigUpdates.enabled) {
          hintText = 'Enter how many polymerase chain reaction (PCR) and enzyme-linked immunosorbent assay (ELISA) test results you got back. You can find this on the summary the vet gave you.'
        }

        return h
          .view(endemicsNumberOfSamplesTested, {
            ...request.payload,
            errorMessage: { text: newErrorMessage, href: '#numberOfSamplesTested' },
            backLink: prefixUrl(endemicsTestUrn),
            hintText
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

      if (config.pigUpdates.enabled) {
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

      return h.redirect(prefixUrl(endemicsDiseaseStatus))
    }
  }
}

export const numberOfSamplesTestedHandlers = [getHandler, postHandler]
