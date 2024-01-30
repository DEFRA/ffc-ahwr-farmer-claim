const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const { urn: urnErrorMessages } = require('../../lib/error-messages')
const {
  endemicsVetRCVS,
  endemicsCheckAnswers,
  endemicsTestUrn,
  endemicsNumberOfTests,
  endemicsTestResults
} = require('../../config/routes')
const {
  endemicsClaim: { laboratoryURN: laboratoryURNKey }
} = require('../../session/keys')

const pageUrl = `${urlPrefix}/${endemicsTestUrn}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { laboratoryURN } = session.getEndemicsClaim(request)
        return h.view(endemicsTestUrn, {
          laboratoryURN,
          backLink: `${urlPrefix}/${endemicsVetRCVS}`
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
          laboratoryURN: Joi.string()
            .trim()
            .max(50)
            .pattern(/^[A-Za-z0-9-]+$/)
            .required()
            .messages({
              'any.required': urnErrorMessages.enterUrn,
              'string.base': urnErrorMessages.enterUrn,
              'string.empty': urnErrorMessages.enterUrn,
              'string.max': urnErrorMessages.urnLength,
              'string.pattern.base': urnErrorMessages.urnPattern
            })
        }),
        failAction: async (request, h, error) => {
          return h
            .view(endemicsTestUrn, {
              ...request.payload,
              errorMessage: { text: error.details[0].message, href: '#laboratoryURN' },
              backLink: `${urlPrefix}/${endemicsVetRCVS}`
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { laboratoryURN } = request.payload
        const { typeOfLivestock } = session.getEndemicsClaim(request)

        session.setEndemicsClaim(request, laboratoryURNKey, laboratoryURN)

        if (typeOfLivestock === 'beef' || typeOfLivestock === 'dairy') {
          return h.redirect(`${urlPrefix}/${endemicsTestResults}`)
        } else if (typeOfLivestock === 'pigs') {
          return h.redirect(`${urlPrefix}/${endemicsNumberOfTests}`)
        }
        // else if (typeOfLivestock === "sheep") {
        return h.redirect(`${urlPrefix}/${endemicsCheckAnswers}`)
      }
    }
  }
]
