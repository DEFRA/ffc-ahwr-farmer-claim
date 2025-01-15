const Joi = require('joi')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { endemicsClaim } = require('../../session/keys')
const { livestockTypes } = require('../../constants/claim')
const {
  claimDashboard,
  endemicsDateOfVisit,
  endemicsWhichSpecies
} = require('../../config/routes')
const urlPrefix = require('../../config').urlPrefix

const pageUrl = `${urlPrefix}/${endemicsWhichSpecies}`
const backLink = claimDashboard
const errorMessage = { text: 'Select which species you are claiming for' }
const view = `${endemicsWhichSpecies}-ms`

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const endemicsClaimData = getEndemicsClaim(request)
      // to do - customise the view for MS as it has different content
      return h.view(view, {
        ...(endemicsClaimData?.typeOfLivestock && {
          previousAnswer: endemicsClaimData.typeOfLivestock
        }),
        backLink
      })
    },
    tags: ['ms']
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
          .code(400)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { typeOfLivestock } = request.payload

      setEndemicsClaim(request, endemicsClaim.typeOfLivestock, typeOfLivestock)

      return h.redirect(`${urlPrefix}/${endemicsDateOfVisit}`)
    }
  }
}

module.exports = { handlers: [getHandler, postHandler] }
