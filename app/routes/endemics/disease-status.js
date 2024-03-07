const Joi = require('joi')
const { endemicsDiseaseStatus, endemicsNumberOfSamplesTested, endemicsBiosecurity } = require('../../config/routes')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { endemicsClaim } = require('../../session/keys')
const { diseaseStatusTypes } = require('../../constants/claim')

const urlPrefix = require('../../config').urlPrefix
const pageUrl = `${urlPrefix}/${endemicsDiseaseStatus}`
const backLink = `${urlPrefix}/${endemicsNumberOfSamplesTested}`
const errorMessage = { text: 'Enter the disease status category' }

module.exports = [
  {
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
  },
  {
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
          return h.view(endemicsDiseaseStatus, {
            errorMessage,
            backLink
          })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { diseaseStatus } = request.payload

        setEndemicsClaim(request, endemicsClaim.diseaseStatus, diseaseStatus)
        return h.redirect(`${urlPrefix}/${endemicsBiosecurity}`)
      }
    }
  }
]
