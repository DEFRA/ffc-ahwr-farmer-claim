import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { getLatestClaimForContext } from '../../lib/context-helper.js'
import { v4 as uuidv4 } from 'uuid'

const { urlPrefix } = config
const {
  endemicsSelectTheHerd,
  endemicsDateOfVisit,
  endemicsEnterHerdName
} = links

const pageUrl = `${urlPrefix}/${endemicsSelectTheHerd}`
const previousPageUrl = `${urlPrefix}/${endemicsDateOfVisit}`
const nextPageUrl = `${urlPrefix}/${endemicsEnterHerdName}`

const { endemicsClaim: { herdId: herdIdKey } } = sessionKeys

const getClaimInfo = (request) => {
  const { data: { typeOfLivestock, claimType, dateOfVisit, claimedDate } } = getLatestClaimForContext(request)

  const claimTypeText = claimType === 'R' ? 'Review' : 'Endemics'

  const dateOfVisitAsDate = new Date(dateOfVisit);
  const dateOfVisitCorrectFormat = dateOfVisitAsDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // TODO BH claimedDate where from?
  return { species: typeOfLivestock, claimType: claimTypeText, lastVisitDate: dateOfVisitCorrectFormat, claimedDate: undefined }
}
const getHerds = (species) => {
  // TODO BH getHerds for call to API
  const name = species == 'sheep' ? 'Breeding Flock' : 'Commercial Herd'
  return [{ herdId: '909bb722-3de1-443e-8304-0bba8f922048', name: name }]
}
const getGroupOfSpeciesName = (typeOfLivestock) => {
  return typeOfLivestock == 'sheep' ? 'flock' : 'herd'
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { typeOfLivestock, herdId } = getEndemicsClaim(request)
      const claimInfo = getClaimInfo(request)
      const herds = getHerds(typeOfLivestock)
      const herdOrFlock = getGroupOfSpeciesName(typeOfLivestock)
      // TODO BH impl temp herd id

      return h.view(endemicsSelectTheHerd, { 
        backLink: previousPageUrl,
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
        const { typeOfLivestock } = getEndemicsClaim(request)
        const claimInfo = getClaimInfo(typeOfLivestock)
        const herds = getHerds(typeOfLivestock)
        const herdOrFlock = getGroupOfSpeciesName(typeOfLivestock)

        return h.view(endemicsSelectTheHerd, {
          ...request.payload,
          errorMessage: {
            text: 'Select the '+herdOrFlock+' you are claiming for',
            href: '#herdId'
          },
          backLink: previousPageUrl,
          ...claimInfo,
          herds,
          herdOrFlock,
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdId } = request.payload
      setEndemicsClaim(request, herdIdKey, herdId)
      // TODO BH set all herd info existing herd selected! 
      // NOTE Don't save herd name as herdName in session, set as herdNameExisting, so the server knows it's a update not insert.
      return h.redirect(nextPageUrl)
    }
  }
}

export const selectTheHerd = [getHandler, postHandler]
