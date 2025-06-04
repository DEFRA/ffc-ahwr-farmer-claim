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
import { ONLY_HERD } from '../../constants/constants.js'
import { OTHERS_ON_SBI } from '../../constants/herd.js'
import { formatDate, getHerdOrFlock } from '../../lib/display-helpers.js'
import { getUnnamedHerdId } from '../../lib/get-unnamed-herd-id.js'

const { endemics } = claimConstants.claimType

const { urlPrefix } = config
const {
  endemicsSelectTheHerd,
  endemicsDateOfVisit,
  endemicsEnterHerdName,
  endemicsCheckHerdDetails,
  endemicsSelectTheHerdException,
  endemicsSelectTheHerdDateException,
  endemicsWhichTypeOfReview
} = links

const pageUrl = `${urlPrefix}/${endemicsSelectTheHerd}`
const previousPageUrl = `${urlPrefix}/${endemicsDateOfVisit}`
const enterHerdNamePageUrl = `${urlPrefix}/${endemicsEnterHerdName}`
const checkHerdDetailsPageUrl = `${urlPrefix}/${endemicsCheckHerdDetails}`
const whichTypeOfReviewPageUrl = `${urlPrefix}/${endemicsWhichTypeOfReview}`
const dateOfVisitPageUrl = `${urlPrefix}/${endemicsDateOfVisit}`

const {
  endemicsClaim: {
    herdId: herdIdKey,
    herdVersion: herdVersionKey,
    herdName: herdNameKey,
    herdCph: herdCphKey,
    herdReasons: herdReasonsKey,
    dateOfVisit: dateOfVisitKey,
    herdOthersOnSbi: herdOthersOnSbiKey,
    herdSame: herdSameKey
  }
} = sessionKeys

const getClaimInfo = (previousClaims, typeOfLivestock) => {
  let claimTypeText
  let dateOfVisitText
  let claimDateText

  const previousClaimsForSpecies = previousClaims?.filter(claim => claim.data.typeOfLivestock === typeOfLivestock)
  if (previousClaimsForSpecies && previousClaimsForSpecies.length > 0) {
    const { createdAt, data: { dateOfVisit, claimType } } =
      previousClaimsForSpecies.reduce((latest, claim) => { return claim.createdAt > latest.createdAt ? claim : latest })

    claimTypeText = claimType === 'R' ? 'Review' : 'Endemics'
    dateOfVisitText = new Date(dateOfVisit).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    claimDateText = new Date(createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return { species: typeOfLivestock, claimType: claimTypeText, lastVisitDate: dateOfVisitText, claimDate: claimDateText }
}

const getMostRecentClaimWithoutHerd = (previousClaims, typeOfLivestock) => {
  const claimsWithoutHerd = previousClaims.filter(
    claim => claim.data.typeOfLivestock === typeOfLivestock && !claim.data.herdId
  )

  if (claimsWithoutHerd.length === 0) { return null }

  return claimsWithoutHerd.reduce(
    (latest, current) => new Date(current.data.dateOfVisit) > new Date(latest.data.dateOfVisit) ? current : latest
  )
}

const createUnnamedHerd = (claim, unnamedHerdId, typeOfLivestock) => (
  {
    herdId: unnamedHerdId,
    herdName: `Unnamed ${getHerdOrFlock(typeOfLivestock)} (Last claim: ${claim.data.claimType === 'R' ? 'review' : 'follow-up'} visit on the ${formatDate(claim.data.dateOfVisit)})`
  }
)

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { typeOfLivestock, herdId, tempHerdId: tempHerdIdFromSession, unnamedHerdId: unnamedHerdIdFromSession, previousClaims, herds } = getEndemicsClaim(request)
      const tempHerdId = getTempHerdId(request, tempHerdIdFromSession)
      const unnamedHerdId = getUnnamedHerdId(request, unnamedHerdIdFromSession)

      const herdOrFlock = getHerdOrFlock(typeOfLivestock)
      const claimInfo = getClaimInfo(previousClaims, typeOfLivestock)

      const claimWithoutHerd = getMostRecentClaimWithoutHerd(previousClaims, typeOfLivestock)

      return h.view(endemicsSelectTheHerd, {
        backLink: previousPageUrl,
        pageTitleText: herds.length > 1 ? `Select the ${herdOrFlock} you are claiming for` : `Is this the same ${herdOrFlock} you have previously claimed for?`,
        tempHerdId,
        ...claimInfo,
        herds: claimWithoutHerd ? herds.concat(createUnnamedHerd(claimWithoutHerd, unnamedHerdId, typeOfLivestock)) : herds,
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

const isUnnamedHerdClaim = (herdId, unnamedHerdId, claim) => herdId === unnamedHerdId && !claim.data.herdId

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
        const { typeOfLivestock, herdId, tempHerdId: tempHerdIdFromSession, unnamedHerdId: unnamedHerdIdFromSession, previousClaims, herds } = getEndemicsClaim(request)
        const tempHerdId = getTempHerdId(request, tempHerdIdFromSession)
        const unnamedHerdId = getUnnamedHerdId(request, unnamedHerdIdFromSession)

        const herdOrFlock = getHerdOrFlock(typeOfLivestock)
        const claimInfo = getClaimInfo(previousClaims, typeOfLivestock)

        const claimWithoutHerd = getMostRecentClaimWithoutHerd(previousClaims, typeOfLivestock)

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
          herds: claimWithoutHerd ? herds.concat(createUnnamedHerd(claimWithoutHerd, unnamedHerdId, typeOfLivestock)) : herds,
          herdOrFlock,
          herdId
        }).code(HttpStatus.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdId } = request.payload
      const endemicsClaim = getEndemicsClaim(request)
      const {
        herds,
        typeOfReview,
        previousClaims,
        typeOfLivestock,
        dateOfVisit,
        organisation,
        latestVetVisitApplication: oldWorldApplication,
        herdId: herdIdFromSession,
        tempHerdId,
        unnamedHerdId
      } = endemicsClaim

      if (herdId !== herdIdFromSession) {
        removeHerdSessionData(request, endemicsClaim)
      }

      setEndemicsClaim(request, herdIdKey, herdId, { shouldEmitEvent: false })

      const { isReview } = getReviewType(typeOfReview)

      if (herdId === tempHerdId && typeOfReview === endemics) {
        return h.view(endemicsSelectTheHerdException, {
          backLink: pageUrl,
          claimForAReviewLink: whichTypeOfReviewPageUrl
        })
          .code(HttpStatus.BAD_REQUEST)
          .takeover()
      }

      const prevHerdClaims = previousClaims.filter(claim =>
        claim.data.typeOfLivestock === typeOfLivestock &&
        (isUnnamedHerdClaim(herdId, unnamedHerdId, claim) || claim.data.herdId === herdId)
      )
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

      const existingHerd = herds.find((herd) => herd.herdId === herdId)
      addHerdToSession(request, existingHerd, herds)
      if (herdId === unnamedHerdId) {
        setEndemicsClaim(request, herdSameKey, 'yes', { shouldEmitEvent: false })
      }

      const nextPageUrl = existingHerd ? checkHerdDetailsPageUrl : enterHerdNamePageUrl

      return h.redirect(nextPageUrl)
    }
  }
}

export const selectTheHerdHandlers = [getHandler, postHandler]
