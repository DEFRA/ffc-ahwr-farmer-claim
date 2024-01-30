const { getEndemicsClaim, setEndemicsClaim, clearEndemicsClaim } = require('../../session')
const { endemicsClaim } = require('../../session/keys')
const {
  vetVisits,
  endemicsDateOfVisit,
  endemicsWhichReviewAnnual
} = require('../../config/routes')
const Joi = require('joi')

const pageUrl = `/claim/${endemicsWhichReviewAnnual}`
const pageView = endemicsWhichReviewAnnual
const backLink = {
  href: vetVisits
}
const errorMessage = { text: 'Select one of the following Livestocks' }

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const endemicsClaimData = getEndemicsClaim(request)

        return h.view(pageView, {
          ...(endemicsClaimData?.typeOfLivestock && {
            previousAnswer: endemicsClaimData.typeOfLivestock
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
          typeOfLivestock: Joi.string()
            .valid('beef', 'dairy', 'sheep', 'pigs')
            .required()
        }),
        failAction: (request, h, _err) => {
          return h
            .view(pageView, {
              errorMessage,
              backLink
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { typeOfLivestock } = request.payload

        clearEndemicsClaim(request)
        setEndemicsClaim(request, endemicsClaim.typeOfLivestock, typeOfLivestock)

        return h.redirect(endemicsDateOfVisit)
      }
    }
  }
]
