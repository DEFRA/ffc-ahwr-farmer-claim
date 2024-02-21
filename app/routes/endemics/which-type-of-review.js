const Joi = require('joi')
const { setEndemicsClaim, getEndemicsClaim } = require('../../session')
const { endemicsClaim: { typeOfReview: typeOfReviewKey, typeOfLivestock: typeOfLivestockKey } } = require('../../session/keys')
const { livestockTypes, claimType } = require('../../constants/claim')
const { vetVisits, endemicsWhichTypeOfReview, endemicsDateOfVisit } = require('../../config/routes')
const { getClaimsByApplicationReference } = require('../../api-requests/claim-service-api')
const { getLatestApplicationsBySbi } = require('../../api-requests/application-service-api')
const urlPrefix = require('../../config').urlPrefix

const pageUrl = `${urlPrefix}/${endemicsWhichTypeOfReview}`
const backLink = vetVisits

const getTypeOfLivestockFromPastClaims = async (sbi) => {
  const applications = await getLatestApplicationsBySbi(sbi)

  const endemicsApplication = applications[0]
  const { reference } = endemicsApplication
  const claims = await getClaimsByApplicationReference(reference)

  if (claims?.length) {
    return claims[0].data?.typeOfLivestock
  }

  const latestVetVisitsApplication = applications.filter((application) => application.type === 'VV')[0]
  return latestVetVisitsApplication.data?.whichReview
}

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { organisation, typeOfReview } = getEndemicsClaim(request)
        const typeOfLivestock = await getTypeOfLivestockFromPastClaims(organisation.sbi)
        setEndemicsClaim(request, typeOfLivestockKey, typeOfLivestock)

        const formattedTypeOfLivestock = [livestockTypes.pigs, livestockTypes.sheep].includes(typeOfLivestock) ? typeOfLivestock : `${typeOfLivestock} cattle`
        return h.view(endemicsWhichTypeOfReview, {
          backLink,
          typeOfLivestock: formattedTypeOfLivestock,
          previousAnswer: typeOfReview
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
          typeOfReview: Joi.string()
            .valid('review', 'endemics')
            .required()
        }),
        failAction: (_request, h, _err) => {
          return h
            .view(endemicsWhichTypeOfReview, {
              errorMessage: { text: 'Select which type of review you are claiming for', href: '#typeOfReview' },
              backLink
            })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { typeOfReview } = request.payload
        setEndemicsClaim(request, typeOfReviewKey, claimType[typeOfReview])

        // For review claim
        return h.redirect(`${urlPrefix}/${endemicsDateOfVisit}`)

        // todo: For endemics claim
      }
    }
  }
]
