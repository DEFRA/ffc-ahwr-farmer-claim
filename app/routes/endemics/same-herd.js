import Joi from 'joi'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getEndemicsClaim, removeSessionDataForSameHerdChange, setEndemicsClaim } from '../../session/index.js'
import HttpStatus from 'http-status-codes'
import { getReviewType } from '../../lib/get-review-type.js'
import { canMakeClaim } from '../../lib/can-make-claim.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { getHerdOrFlock } from '../../lib/display-helpers.js'
import { getNextMultipleHerdsPage } from '../../lib/get-next-multiple-herds-page.js'

const { urlPrefix } = config
const {
  endemicsSameHerd,
  endemicsCheckHerdDetails,
  endemicsDateOfVisit,
  endemicsWhichTypeOfReview,
  endemicsSameHerdException
} = links

const dateOfVisitPageUrl = `${urlPrefix}/${endemicsDateOfVisit}`
const whichTypeOfReviewPageUrl = `${urlPrefix}/${endemicsWhichTypeOfReview}`

const pageUrl = `${urlPrefix}/${endemicsSameHerd}`
const previousPageUrl = `${urlPrefix}/${endemicsCheckHerdDetails}`

const {
  endemicsClaim: {
    herdSame: herdSameKey,
    dateOfVisit: dateOfVisitKey,
    typeOfReview: typeOfReviewKey
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

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    tags: ['mh'],
    handler: async (request, h) => {
      const { typeOfLivestock, previousClaims, herdSame } = getEndemicsClaim(request)
      const herdOrFlock = getHerdOrFlock(typeOfLivestock)
      const claimInfo = getClaimInfo(previousClaims, typeOfLivestock)

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
        const { typeOfLivestock, previousClaims, herdSame } = getEndemicsClaim(request)
        const herdOrFlock = getHerdOrFlock(typeOfLivestock)
        const claimInfo = getClaimInfo(previousClaims, typeOfLivestock)

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
      const { herdSame: herdSameFromSession } = getEndemicsClaim(request)

      if (herdSame !== herdSameFromSession) {
        removeSessionDataForSameHerdChange(request)
      }

      setEndemicsClaim(request, herdSameKey, herdSame, { shouldEmitEvent: false })

      const {
        previousClaims,
        typeOfReview,
        dateOfVisit,
        organisation,
        typeOfLivestock,
        latestVetVisitApplication: oldWorldApplication
      } = getEndemicsClaim(request)
      const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)

      if (herdSame === 'yes') {
        const prevClaims = previousClaims.filter(claim => claim.data.typeOfLivestock === typeOfLivestock)

        const errorMessage = canMakeClaim({ prevClaims, typeOfReview, dateOfVisit, organisation, typeOfLivestock, oldWorldApplication })

        if (errorMessage) {
          raiseInvalidDataEvent(
            request, dateOfVisitKey,
            `Value ${dateOfVisit} is invalid. Error: ${errorMessage}`
          )

          return h
            .view(endemicsSameHerdException, {
              backLink: pageUrl,
              errorMessage,
              backToPageText: 'If you entered the wrong date, you\'ll need to go back and enter the correct date.',
              backToPageMessage: `Enter the date the vet last visited your farm for this ${isReview ? 'review' : 'follow-up'}.`,
              backToPageLink: dateOfVisitPageUrl
            })
            .code(HttpStatus.BAD_REQUEST)
            .takeover()
        }
      }

      if (herdSame === 'no' && isEndemicsFollowUp) {
        raiseInvalidDataEvent(
          request,
          typeOfReviewKey,
          'Cannot claim for endemics without a previous review.'
        )

        return h
          .view(endemicsSameHerdException, {
            backLink: pageUrl,
            errorMessage: 'You must have an approved review claim for the different herd or flock, before you can claim for a follow-up.',
            backToPageText: 'If you have not claimed for the review yet, you will need to submit a claim and have the claim approved first.',
            backToPageMessage: 'Claim for a review',
            backToPageLink: whichTypeOfReviewPageUrl
          })
          .code(HttpStatus.BAD_REQUEST)
          .takeover()
      }

      return h.redirect(getNextMultipleHerdsPage(request))
    }
  }
}

export const sameHerdHandlers = [getHandler, postHandler]
