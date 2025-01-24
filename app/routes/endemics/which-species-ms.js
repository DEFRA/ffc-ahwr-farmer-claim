const Joi = require('joi')
const { getEndemicsClaim, setEndemicsClaim, clearEndemicsClaim, getApplication } = require('../../session')
const { endemicsClaim } = require('../../session/keys')
const { livestockTypes } = require('../../constants/claim')
const {
  claimDashboard,
  endemicsWhichSpecies,
  endemicsWhichTypeOfReview
} = require('../../config/routes')
const { redirectReferenceMissing } = require('../../lib/redirect-reference-missing')
const { resetEndemicClaimSession } = require('../../lib/context-helper')
const urlPrefix = require('../../config').urlPrefix

const pageUrl = `${urlPrefix}/${endemicsWhichSpecies}`
const backLink = claimDashboard
const errorMessage = { text: 'Select which species you are claiming for' }
const view = `${endemicsWhichSpecies}-ms`

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    pre: [{ method: redirectReferenceMissing }],
    handler: async (request, h) => {
      const endemicsClaim = getEndemicsClaim(request)
      // to do - customise the view for MS as it has different content
      return h.view(view, {
        ...(endemicsClaim?.typeOfLivestock && {
          previousAnswer: endemicsClaim.typeOfLivestock
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
      const { typeOfLivestock: prevTypeOfLivestock, reference, } = getEndemicsClaim(request)
      const { latestEndemicsApplication } = getApplication(request)

      if (typeOfLivestock !== prevTypeOfLivestock) {
        await resetEndemicClaimSession(request, latestEndemicsApplication.reference, reference)  
      }

      setEndemicsClaim(request, endemicsClaim.typeOfLivestock, typeOfLivestock)

      return h.redirect(`${urlPrefix}/${endemicsWhichTypeOfReview}`)
    }
  }
}

module.exports = { handlers: [getHandler, postHandler] }
