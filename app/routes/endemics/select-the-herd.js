import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
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

const getClaimInfo = (species) => {
  return { species: species, claimType: 'Review', lastVisitDate: '11 December 2024', claimedDate: '11 March 2025' }
}
const getHerds = (species) => {
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
      const { typeOfLivestock } = getEndemicsClaim(request)
      const claimInfo = getClaimInfo(typeOfLivestock)
      const herds = getHerds(typeOfLivestock)
      const herdOrFlock = getGroupOfSpeciesName(typeOfLivestock)
      const { herdId } = getEndemicsClaim(request)

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
