const Joi = require('joi')
const { getEndemicsClaim, setEndemicsClaim, clearEndemicsClaim } = require('../../session')
const { endemicsClaim } = require('../../session/keys')
const { livestockTypes, claimType } = require('../../constants/claim')
const {
  vetVisits,
  endemicsDateOfVisit,
  endemicsWhichReviewAnnual
} = require('../../config/routes')
const urlPrefix = require('../../config').urlPrefix

const pageUrl = `${urlPrefix}/${endemicsWhichReviewAnnual}`
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

        return h.view(endemicsWhichReviewAnnual, {
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
            .valid(...Object.values(livestockTypes))
            .required()
        }),
        failAction: (request, h, _err) => {
          return h
            .view(endemicsWhichReviewAnnual, {
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
        setEndemicsClaim(request, endemicsClaim.typeOfReview, claimType.review)

        return h.redirect(`${urlPrefix}/${endemicsDateOfVisit}`)
      }
    }
  }
]
