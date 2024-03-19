const Joi = require('joi')
const { urlPrefix, ruralPaymentsAgency } = require('../../config')
const { endemicsTestResults, endemicsBiosecurity, endemicsCheckAnswers, endemicsDiseaseStatus, endemicsBiosecurityException } = require('../../config/routes')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { livestockTypes } = require('../../constants/claim')
const { biosecurity: biosecurityKey } = require('../../session/keys').endemicsClaim

const pageUrl = `${urlPrefix}/${endemicsBiosecurity}`

const previousPageUrl = (request) => {
  const { typeOfLivestock } = getEndemicsClaim(request)
  return (typeOfLivestock === livestockTypes.pigs) ? `${urlPrefix}/${endemicsDiseaseStatus}` : `${urlPrefix}/${endemicsTestResults}`
}

const getAssessmentPercentageErrorMessage = (biosecurity, assessmentPercentage) => {
  if (biosecurity === undefined) return

  switch (true) {
    case assessmentPercentage === '':
      return 'Enter the assessment percentage'
    case Number(assessmentPercentage) < 1:
      return 'Assessment percentage cannot be less than 1'
    case Number(assessmentPercentage) > 100:
      return 'Assessment percentage cannot be more than 100'
    default:
      return 'The assessment percentage can only include numbers'
  }
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
              'any.required': 'Select whether the vet did a biosecurity assessment'
            }
          ),
          assessmentPercentage: Joi.when('biosecurity', {
            is: Joi.valid('yes'),
            then: Joi.string().pattern(/^[1-9][0-9]?$|^100$/)
          })
        }),
        failAction: (request, h, error) => {
          const { typeOfLivestock } = getEndemicsClaim(request)
          const { biosecurity, assessmentPercentage } = request.payload
          const assessmentPercentageErrorMessage = getAssessmentPercentageErrorMessage(biosecurity, assessmentPercentage)

          const errorMessage = biosecurity ? { text: assessmentPercentageErrorMessage, href: '#assessmentPercentage' } : { text: 'Select whether the vet did a biosecurity assessment', href: '#biosecurity' }
          const errors = {
            errorMessage,
            radioErrorMessage: biosecurity === undefined ? { text: 'Select whether the vet did a biosecurity assessment', href: '#biosecurity' } : undefined,
            inputErrorMessage: assessmentPercentageErrorMessage ? { text: assessmentPercentageErrorMessage, href: '#assessmentPercentage' } : undefined,
          }

          return h.view(endemicsBiosecurity, {
            backLink: previousPageUrl(request),
            typeOfLivestock,
            ...errors,
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
          return h.view(endemicsBiosecurityException, { backLink: pageUrl, ruralPaymentsAgency }).code(400).takeover()
        }

        setEndemicsClaim(request, biosecurityKey, typeOfLivestock === pigs ? { biosecurity, assessmentPercentage } : biosecurity)
        return h.redirect(`${urlPrefix}/${endemicsCheckAnswers}`)
      }
    }
  }
]
