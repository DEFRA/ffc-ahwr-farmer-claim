import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim, removeHerdSessionData } from '../../session/index.js'
import HttpStatus from 'http-status-codes'
import { getTempHerdId } from '../../lib/get-temp-herd-id.js'
import { claimConstants } from '../../constants/claim.js'
import { canMakeClaim } from '../../lib/can-make-claim.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { getReviewType } from '../../lib/get-review-type.js'
import { ONLY_HERD } from './herd-others-on-sbi.js'
import { OTHERS_ON_SBI } from '../../constants/herd.js'

const { endemics } = claimConstants.claimType

const { urlPrefix } = config
const {
  endemicsSelectTheHerd,
  endemicsDateOfVisit,
  endemicsEnterHerdName,
  endemicsCheckHerdDetails,
  endemicsSelectTheHerdException,
  endemicsSelectTheHerdDateException,
  endemicsWhichSpecies
} = links

const pageUrl = `${urlPrefix}/${endemicsSelectTheHerd}`
const previousPageUrl = `${urlPrefix}/${endemicsDateOfVisit}`
const enterHerdNamePageUrl = `${urlPrefix}/${endemicsEnterHerdName}`
const checkHerdDetailsPageUrl = `${urlPrefix}/${endemicsCheckHerdDetails}`
const whichSpeciesPageUrl = `${urlPrefix}/${endemicsWhichSpecies}`
const dateOfVisitPageUrl = `${urlPrefix}/${endemicsDateOfVisit}`

const {
  endemicsClaim: {
    herdId: herdIdKey,
    herdVersion: herdVersionKey,
    herdName: herdNameKey,
    herdCph: herdCphKey,
    herdReasons: herdReasonsKey,
    dateOfVisit: dateOfVisitKey,
    herdOthersOnSbi: herdOthersOnSbiKey
  }
} = sessionKeys

const getClaimInfo = (previousClaims, typeOfLivestock) => {
  let claimTypeText
  let dateOfVisitText
  let claimDateText

  const previousClaimsForSpecies = previousClaims?.filter(claim => claim.data.typeOfLivestock === typeOfLivestock)
  if (previousClaimsForSpecies && previousClaimsForSpecies.length > 0) {
    const { createdAt, data: { typeOfReview, dateOfVisit } } =
      previousClaimsForSpecies.reduce((latest, claim) => { return claim.createdAt > latest.createdAt ? claim : latest })

    claimTypeText = typeOfReview === 'R' ? 'Review' : 'Endemics'
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
      const { typeOfLivestock, herdId, tempHerdId: tempHerdIdFromSession, previousClaims, herds } = getEndemicsClaim(request)
      const tempHerdId = getTempHerdId(request, tempHerdIdFromSession)
      const herdOrFlock = getGroupOfSpeciesName(typeOfLivestock)
      const claimInfo = getClaimInfo(previousClaims, typeOfLivestock)

      return h.view(endemicsSelectTheHerd, {
        backLink: previousPageUrl,
        pageTitleText: herds.length > 1 ? `Select the ${herdOrFlock} you are claiming for` : `Is this the same ${herdOrFlock} you have previously claimed for?`,
        tempHerdId,
        ...claimInfo,
        herds,
        herdOrFlock,
        herdId
      })
    }
  }
}

const addHerdToSession = (request, existingHerd, herds) => {
  if (existingHerd) {
    setEndemicsClaim(request, herdVersionKey, existingHerd.herdVersion + 1, { shouldEmitEvent: false })
    setEndemicsClaim(request, herdNameKey, existingHerd.herdName, { shouldEmitEvent: false })
    setEndemicsClaim(request, herdCphKey, existingHerd.cph, { shouldEmitEvent: false })
    setEndemicsClaim(request, herdReasonsKey, existingHerd.herdReasons, { shouldEmitEvent: false })
    setEndemicsClaim(request, herdOthersOnSbiKey, existingHerd.herdReasons?.[0] === ONLY_HERD ? OTHERS_ON_SBI.YES : OTHERS_ON_SBI.NO, { shouldEmitEvent: false })
  } else {
    if (herds.length) {
      setEndemicsClaim(request, herdOthersOnSbiKey, OTHERS_ON_SBI.NO, { shouldEmitEvent: false })
    }
    setEndemicsClaim(request, herdVersionKey, 1, { shouldEmitEvent: false })
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
        const { typeOfLivestock, tempHerdId: tempHerdIdFromSession, previousClaims, herds } = getEndemicsClaim(request)
        const tempHerdId = getTempHerdId(request, tempHerdIdFromSession)
        const herdOrFlock = getGroupOfSpeciesName(typeOfLivestock)
        const claimInfo = getClaimInfo(previousClaims, typeOfLivestock)

        return h.view(endemicsSelectTheHerd, {
          ...request.payload,
          errorMessage: {
            text: `Select the ${herdOrFlock} you are claiming for`,
            href: '#herdId'
          },
          backLink: previousPageUrl,
          pageTitleText: herds.length > 1 ? `Select the ${herdOrFlock} you are claiming for` : `Is this the same ${herdOrFlock} you have previously claimed for?`,
          tempHerdId,
          ...claimInfo,
          herds,
          herdOrFlock
        }).code(HttpStatus.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdId } = request.payload
      const {
        herds,
        typeOfReview,
        previousClaims,
        typeOfLivestock,
        dateOfVisit,
        organisation,
        latestVetVisitApplication: oldWorldApplication,
        herdId: herdIdFromSession
      } = getEndemicsClaim(request)

      if (herdId !== herdIdFromSession) {
        removeHerdSessionData(request, undefined)
      }

      setEndemicsClaim(request, herdIdKey, herdId, { shouldEmitEvent: false })

      const { isReview } = getReviewType(typeOfReview)
      const existingHerd = herds.find((herd) => herd.herdId === herdId)

      if (!existingHerd && typeOfReview === endemics) {
        return h.view(endemicsSelectTheHerdException, {
          backLink: pageUrl,
          claimForAReviewLink: whichSpeciesPageUrl
        })
          .code(HttpStatus.BAD_REQUEST)
          .takeover()
      }

      const prevHerdClaims = previousClaims.filter(claim => claim.data.typeOfLivestock === typeOfLivestock && claim.data.herdId === herdId)
      const errorMessage = canMakeClaim({ prevClaims: prevHerdClaims, typeOfReview, dateOfVisit, organisation, typeOfLivestock, oldWorldApplication })

      if (errorMessage) {
        raiseInvalidDataEvent(
          request, dateOfVisitKey,
          `Value ${dateOfVisit} is invalid. Error: ${errorMessage}`
        )

        return h
          .view(`${endemicsSelectTheHerdDateException}`, {
            backLink: pageUrl,
            errorMessage,
            ruralPaymentsAgency: config.ruralPaymentsAgency,
            backToPageMessage: `Enter the date the vet last visited your farm for this ${isReview ? 'review' : 'follow-up'}.`,
            backToPageLink: dateOfVisitPageUrl
          })
          .code(HttpStatus.BAD_REQUEST)
          .takeover()
      }

      addHerdToSession(request, existingHerd, herds)

      const nextPageUrl = existingHerd ? checkHerdDetailsPageUrl : enterHerdNamePageUrl

      return h.redirect(nextPageUrl)
    }
  }
}

export const selectTheHerdHandlers = [getHandler, postHandler]
