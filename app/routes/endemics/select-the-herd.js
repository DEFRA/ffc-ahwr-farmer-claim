import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import HttpStatus from 'http-status-codes'
import { getTempHerdId } from '../../lib/get-temp-herd-id.js'
import { claimConstants } from '../../constants/claim.js'
import { canMakeClaim } from '../../lib/can-make-claim.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { getReviewType } from '../../lib/get-review-type.js'

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
    herdExists: herdExistsKey,
    dateOfVisit: dateOfVisitKey
  }
} = sessionKeys

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
      const { typeOfLivestock, herdId, tempHerdId: tempHerdIdFromSession, previousClaims, typeOfReview, herds } = getEndemicsClaim(request)
      const tempHerdId = getTempHerdId(request, tempHerdIdFromSession)
      const herdOrFlock = getGroupOfSpeciesName(typeOfLivestock)
      const claimInfo = getClaimInfo(previousClaims, typeOfLivestock, typeOfReview)

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
        const { typeOfLivestock, tempHerdId: tempHerdIdFromSession, previousClaims, typeOfReview, herds } = getEndemicsClaim(request)
        const tempHerdId = getTempHerdId(request, tempHerdIdFromSession)
        const herdOrFlock = getGroupOfSpeciesName(typeOfLivestock)
        const claimInfo = getClaimInfo(previousClaims, typeOfLivestock, typeOfReview)

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
      console.log({
        herdId
      })
      setEndemicsClaim(request, herdIdKey, herdId)

      const {
        herds,
        typeOfReview,
        previousClaims,
        typeOfLivestock,
        dateOfVisit,
        organisation,
        latestVetVisitApplication: oldWorldApplication
      } = getEndemicsClaim(request)
      const { isReview } = getReviewType(typeOfReview)

      const existingHerd = herds.find((herd) => herd.herdId === herdId)

      if (!existingHerd && typeOfReview === endemics) {
        return h.view(endemicsSelectTheHerdException, {
          backLink: pageUrl,
          claimForAReviewLink: whichSpeciesPageUrl
        })
          .code(400)
          .takeover()
      }

      const prevHerdClaims = previousClaims.filter(claim => claim.data.typeOfLivestock === typeOfLivestock && claim.data.herdId === herdId)
      const errorMessage = canMakeClaim({ prevClaims: prevHerdClaims, typeOfReview, dateOfVisit, organisation, typeOfLivestock, oldWorldApplication })

      if (errorMessage) {
        raiseInvalidDataEvent(
          request, dateOfVisitKey,
          `Value ${dateOfVisit} is invalid. Error: ${errorMessage}`
        )

        setEndemicsClaim(request, dateOfVisitKey, dateOfVisit)

        return h
          .view(`${endemicsSelectTheHerdDateException}`, {
            backLink: pageUrl,
            errorMessage,
            ruralPaymentsAgency: config.ruralPaymentsAgency,
            backToPageMessage: `Enter the date the vet last visited your farm for this ${isReview ? 'review' : 'follow-up'}.`,
            backToPageLink: dateOfVisitPageUrl
          })
          .code(400)
          .takeover()
      }

      setEndemicsClaim(request, herdExistsKey, !!existingHerd)

      if (existingHerd) {
        setEndemicsClaim(request, herdVersionKey, existingHerd.herdVersion + 1)
        setEndemicsClaim(request, herdNameKey, existingHerd.herdName)
        setEndemicsClaim(request, herdCphKey, existingHerd.cph)
        setEndemicsClaim(request, herdReasonsKey, existingHerd.herdReasons)
      } else {
        setEndemicsClaim(request, herdVersionKey, 1)
      }

      const nextPageUrl = existingHerd ? checkHerdDetailsPageUrl : enterHerdNamePageUrl

      return h.redirect(nextPageUrl)
    }
  }
}

export const selectTheHerdHandlers = [getHandler, postHandler]
