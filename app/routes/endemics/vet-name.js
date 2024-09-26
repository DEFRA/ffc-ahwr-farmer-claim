const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const { name: nameErrorMessages } = require('../../../app/lib/error-messages')
const { endemicsNumberOfSpeciesTested, endemicsVetName, endemicsVetRCVS, endemicsSpeciesNumbers, endemicsSheepName } = require('../../config/routes')
const {
  endemicsClaim: { vetsName: vetsNameKey }
} = require('../../session/keys')
const { getLivestockTypes } = require('../../lib/get-livestock-types')
const { getReviewType } = require('../../lib/get-review-type')

const pageUrl = `${urlPrefix}/${endemicsVetName}`
const backLink = (request) => {
  const { typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)
  const { isBeef, isDairy, isSheep } = getLivestockTypes(typeOfLivestock)
  const { isEndemicsFollowUp } = getReviewType(typeOfReview)

  if (isDairy || (isBeef && isEndemicsFollowUp)) return `${urlPrefix}/${endemicsSpeciesNumbers}`

  if (isSheep) {
    return `${urlPrefix}/${endemicsSheepName}`
  }

  return `${urlPrefix}/${endemicsNumberOfSpeciesTested}`
}

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { vetsName } = session.getEndemicsClaim(request)
        return h.view(endemicsVetName, {
          vetsName,
          backLink: backLink(request)
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
          vetsName: Joi.string()
            .trim()
            .max(50)
            .pattern(/^[A-Za-z0-9&,' \-/()]+$/)
            .required()
            .messages({
              'any.required': nameErrorMessages.enterName,
              'string.base': nameErrorMessages.enterName,
              'string.empty': nameErrorMessages.enterName,
              'string.max': nameErrorMessages.nameLength,
              'string.pattern.base': nameErrorMessages.namePattern
            })
        }),
        failAction: async (request, h, error) => {
          return h
            .view(endemicsVetName, {
              ...request.payload,
              backLink: backLink(request),
              errorMessage: { text: error.details[0].message, href: `#${vetsNameKey}}` }
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { vetsName } = request.payload
        session.setEndemicsClaim(request, vetsNameKey, vetsName)
        return h.redirect(`${urlPrefix}/${endemicsVetRCVS}`)
      }
    }
  }
]
