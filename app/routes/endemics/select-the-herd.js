import Joi from 'joi'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'

const { urlPrefix } = config
const {
  endemicsSelectTheHerd,
  endemicsDateOfVisit,
  endemicsEnterHerdName
} = links

const pageUrl = `${urlPrefix}/${endemicsSelectTheHerd}`
const previousPageUrl = `${urlPrefix}/${endemicsDateOfVisit}`
const nextPageUrl = `${urlPrefix}/${endemicsEnterHerdName}`

const { endemicsClaim: { tempHerdId: tempHerdIdKey, herdId: herdIdKey } } = sessionKeys

const getTempHerdId = (request, tempHerdIdFromSession) => {
  let tempHerdId
  if (tempHerdIdFromSession) {
    tempHerdId = tempHerdIdFromSession
  } else {
    tempHerdId = uuidv4()
    setEndemicsClaim(request, tempHerdIdKey, tempHerdId)
  }
  return tempHerdId
}

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
const getHerds = (species) => {
  // TODO BH getHerds for call to API
  const name = species === 'sheep' ? 'Breeding Flock' : 'Commercial Herd'
  return [{ herdId: '909bb722-3de1-443e-8304-0bba8f922048', name: name }]
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
      const { typeOfLivestock, herdId, tempHerdId: tempHerdIdFromSession, previousClaims, typeOfReview } = getEndemicsClaim(request)
      const tempHerdId = getTempHerdId(request, tempHerdIdFromSession)
      const herdOrFlock = getGroupOfSpeciesName(typeOfLivestock)
      const claimInfo = getClaimInfo(previousClaims, typeOfLivestock, typeOfReview)
      const herds = getHerds(typeOfLivestock)

      return h.view(endemicsSelectTheHerd, {
        backLink: previousPageUrl,
        tempHerdId,
        ...claimInfo,
        herds,
        herdOrFlock,
        herdId
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
        herdId: Joi.string().uuid().required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        const { typeOfLivestock, tempHerdId: tempHerdIdFromSession, previousClaims, typeOfReview } = getEndemicsClaim(request)
        const tempHerdId = getTempHerdId(request, tempHerdIdFromSession)
        const herdOrFlock = getGroupOfSpeciesName(typeOfLivestock)
        const claimInfo = getClaimInfo(previousClaims, typeOfLivestock, typeOfReview)
        const herds = getHerds(typeOfLivestock)

        return h.view(endemicsSelectTheHerd, {
          ...request.payload,
          errorMessage: {
            text: 'Select the ' + herdOrFlock + ' you are claiming for',
            href: '#herdId'
          },
          backLink: previousPageUrl,
          tempHerdId,
          ...claimInfo,
          herds,
          herdOrFlock
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdId } = request.payload
      setEndemicsClaim(request, herdIdKey, herdId)
      // TODO MultiHerds set all herd info existing herd selected!
      // NOTE Don't save herd name as herdName in session, set as herdNameExisting, so the server knows it's a update not insert.
      return h.redirect(nextPageUrl)
    }
  }
}

export const selectTheHerd = [getHandler, postHandler]
