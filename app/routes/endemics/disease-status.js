const Joi = require('joi')
const { urlPrefix } = require('../../config')
const { endemicsDiseaseStatus } = require('../../config/routes')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { endemicsClaim } = require('../../session/keys')
const { diseaseStatusTypes, claimType } = require('../../constants/claim')

const pageUrl = `${urlPrefix}/${endemicsDiseaseStatus}`

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
      handler: async(request, h) => {
        const {diseaseStatus} = request.payload

        setEndemicsClaim(request, endemicsClaim.diseaseStatus, diseaseStatus)
        setEndemicsClaim(request, endemicsClaim.diseaseStatus, claimType.review)

        return h.redirect(`${urlPrefix}/${endemicsBiosecurity}`)
      }
    }
  }
]
