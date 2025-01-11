const Joi = require('joi')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { endemicsClaim } = require('../../session/keys')
const { livestockTypes, claimType } = require('../../constants/claim')
const {
  claimDashboard,
  endemicsDateOfVisit,
  endemicsWhichSpecies
} = require('../../config/routes')
const urlPrefix = require('../../config').urlPrefix

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

      setEndemicsClaim(request, endemicsClaim.typeOfLivestock, typeOfLivestock)
      // not sure we should be setting this here, but for now will keep it so as not to disrupt current flows
      setEndemicsClaim(request, endemicsClaim.typeOfReview, claimType.review)

      return h.redirect(`${urlPrefix}/${endemicsDateOfVisit}`)
    }
  }
}

module.exports = { handlers: [getHandler, postHandler] }
