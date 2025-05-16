import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import HttpStatus from 'http-status-codes'

const { urlPrefix } = config
const {
  endemicsSameHerd,
  endemicsCheckHerdDetails,
  endemicsDateOfTesting
} = links

const pageUrl = `${urlPrefix}/${endemicsSameHerd}`
const previousPageUrl = `${urlPrefix}/${endemicsCheckHerdDetails}`
const nextPageUrl = `${urlPrefix}/${endemicsDateOfTesting}`

const { endemicsClaim: { herdSame: herdSameKey } } = sessionKeys

const getClaimInfo = (previousClaims, typeOfLivestock, typeOfReview) => {
  const claimTypeText = typeOfReview === 'R' ? 'Review' : 'Endemics'
  let dateOfVisitText
  let claimDateText

  const previousClaimsForSpecies = previousClaims?.filter(claim => claim.data.typeOfLivestock === typeOfLivestock)
  if (previousClaimsForSpecies && previousClaimsForSpecies.length > 0) {
    const { createdAt, data: { dateOfVisit } } =
      previousClaimsForSpecies.reduce((latest, claim) => { return claim.createdAt > latest.createdAt ? claim : latest })

    dateOfVisitText = new Date(dateOfVisit).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    claimDateText = new Date(createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return { species: typeOfLivestock, claimType: claimTypeText, lastVisitDate: dateOfVisitText, claimDate: claimDateText }
}

const getGroupOfSpeciesName = (typeOfLivestock) => {
  return typeOfLivestock === 'sheep' ? 'flock' : 'herd'
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { typeOfLivestock, previousClaims, typeOfReview, herdSame } = getEndemicsClaim(request)
      const herdOrFlock = getGroupOfSpeciesName(typeOfLivestock)
      const claimInfo = getClaimInfo(previousClaims, typeOfLivestock, typeOfReview)

      return h.view(endemicsSameHerd, {
        backLink: previousPageUrl,
        ...claimInfo,
        herdOrFlock,
        herdSame
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
        herdSame: Joi.string().valid('yes', 'no').required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        const { typeOfLivestock, previousClaims, typeOfReview, herdSame } = getEndemicsClaim(request)
        const herdOrFlock = getGroupOfSpeciesName(typeOfLivestock)
        const claimInfo = getClaimInfo(previousClaims, typeOfLivestock, typeOfReview)

        return h.view(endemicsSameHerd, {
          ...request.payload,
          errorMessage: {
            text: `Select yes if it is the same ${herdOrFlock}`,
            href: '#herdSame'
          },
          backLink: previousPageUrl,
          ...claimInfo,
          herdOrFlock,
          herdSame
        }).code(HttpStatus.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdSame } = request.payload
      setEndemicsClaim(request, herdSameKey, herdSame)
      return h.redirect(nextPageUrl)
    }
  }
}

export const sameHerdHandlers = [getHandler, postHandler]
