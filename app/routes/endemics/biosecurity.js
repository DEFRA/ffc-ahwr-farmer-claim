const Joi = require('joi')
const { urlPrefix } = require('../../config')
const { endemicsTestResults, endemicsBiosecurity, endemicsCheckAnswers, endemicsDiseaseStatus, endemicsBiosecurityException } = require('../../config/routes')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { livestockTypes } = require('../../constants/claim')
const { biosecurity: biosecurityKey } = require('../../session/keys').endemicsClaim

const pageUrl = `${urlPrefix}/${endemicsBiosecurity}`

const previousPageUrl = (request) => {
  const { typeOfLivestock } = getEndemicsClaim(request)
  return (typeOfLivestock === livestockTypes.pigs) ? `${urlPrefix}/${endemicsDiseaseStatus}` : `${urlPrefix}/${endemicsTestResults}`
}

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { biosecurity, typeOfLivestock } = getEndemicsClaim(request)
        return h.view(
          endemicsBiosecurity,
          {
            previousAnswer: biosecurity,
            typeOfLivestock,
            backLink: previousPageUrl(request)
          }
        )
      }
    }
  },
  {
    method: 'POST',
    path: pageUrl,
    options: {
      validate: {
        payload: Joi.object({
          typeOfLivestock: Joi.string(),
          biosecurity: Joi.string().valid('yes', 'no').required().messages(
            {
              'string.empty': 'Select whether the vet did a biosecurity assessment',
              'string.base': 'Select whether the vet did a biosecurity assessment'
            }
          ),
          assessmentPercentage: Joi.when('biosecurity', {
            is: Joi.valid('yes'),
            then: Joi.string().pattern(/^[1-9][0-9]?$|^100$/).max(3).messages({
              'string.base': 'Enter the assessment percentage',
              'string.empty': 'Enter the assessment percentage',
              'string.min': 'Assessment percentage must be at least 1',
              'string.max': 'Assessment percentage must be at most 100',
              'string.pattern.base': 'The assessment percentage can only include numbers'
            })
          })
        }),
        failAction: (request, h, error) => {
          const { typeOfLivestock } = getEndemicsClaim(request)
          const { biosecurity } = request.payload
          return h.view(endemicsBiosecurity, {
            backLink: previousPageUrl(request),
            typeOfLivestock,
            errorMessage: { text: error.details[0].message, href: `#${biosecurityKey}` },
            previousAnswer: biosecurity

          })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { pigs } = livestockTypes
        const { typeOfLivestock } = getEndemicsClaim(request)
        const { biosecurity, assessmentPercentage } = request.payload
        if (biosecurity === 'no') {
          return h.view(endemicsBiosecurityException, { backLink: pageUrl }).code(400).takeover()
        }
        if (biosecurity === 'yes') {
          if (typeOfLivestock === pigs) {
            const biosecurityValues = {
              biosecurity,
              assessmentPercentage
            }
            setEndemicsClaim(request, biosecurityKey, biosecurityValues)
            return h.redirect(`${urlPrefix}/${endemicsCheckAnswers}`)
          }
          setEndemicsClaim(request, biosecurityKey, biosecurity)
          return h.redirect(`${urlPrefix}/${endemicsCheckAnswers}`)
        }
      }
    }
  }
]
