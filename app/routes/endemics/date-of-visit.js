import joi from 'joi'
import appInsights from 'applicationinsights'
import { sessionKeys } from '../../session/keys.js'
import { config } from '../../config/index.js'
import { claimConstants } from '../../constants/claim.js'
import { visitDate } from '../../config/visit-date.js'
import routes from '../../config/routes.js'
import { getOldWorldClaimFromApplication } from '../../lib/index.js'
import { isValidDate } from '../../lib/date-utils.js'
import { getReviewType } from '../../lib/get-review-type.js'
import { getEndemicsClaim, removeMultipleHerdsSessionData, setEndemicsClaim } from '../../session/index.js'
import { getLivestockTypes } from '../../lib/get-livestock-types.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { canMakeClaim } from '../../lib/can-make-claim.js'
import { MULTIPLE_SPECIES_RELEASE_DATE, PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE } from '../../constants/constants.js'
import { isMultipleHerdsUserJourney } from '../../lib/context-helper.js'
import { getHerds } from '../../api-requests/application-service-api.js'
import { getTempHerdId } from '../../lib/get-temp-herd-id.js'
import { getNextMultipleHerdsPage } from '../../lib/get-next-multiple-herds-page.js'
import { getAllClaimsForFirstHerd } from '../../lib/get-all-claims-for-first-herd.js'
import HttpStatus from 'http-status-codes'

const MAX_POSSIBLE_DAY = 31
const MAX_POSSIBLE_MONTH = 12

const {
  endemicsClaim: {
    typeOfReview: typeOfReviewKey, dateOfVisit: dateOfVisitKey, tempHerdId: tempHerdIdKey, herds: herdsKey, herdVersion: herdVersionKey, herdId: herdIdKey
  }
} = sessionKeys

const {
  endemicsDateOfVisit,
  endemicsDateOfVisitException,
  endemicsWhichTypeOfReview,
  endemicsVetVisitsReviewTestResults,
  endemicsMultipleSpeciesDateException,
  endemicsDairyFollowUpDateException,
  endemicsSelectTheHerd,
  endemicsEnterHerdName,
  endemicsWhichTypeOfReviewException
} = routes

const { claimType, livestockTypes } = claimConstants
const { labels } = visitDate

const pageUrl = `${config.urlPrefix}/${endemicsDateOfVisit}`
const whichTypeOfReviewPageUrl = `${config.urlPrefix}/${endemicsWhichTypeOfReview}`

const isMSClaimBeforeMSRelease = (previousClaims, typeOfLivestock, dateOfVisit) => previousClaims?.some(claim => claim.data.typeOfLivestock !== typeOfLivestock) && dateOfVisit < MULTIPLE_SPECIES_RELEASE_DATE

export const previousPageUrl = (latestVetVisitApplication, typeOfReview, previousClaims, typeOfLivestock) => {
  const relevantClaims = previousClaims.filter(claim => claim.data.typeOfLivestock === typeOfLivestock)

  const oldWorldClaimTypeOfLivestock = latestVetVisitApplication?.data?.whichReview

  const isCattleEndemicsClaimForOldWorldReview =
    typeOfReview === claimType.endemics &&
    [livestockTypes.beef, livestockTypes.dairy].includes(oldWorldClaimTypeOfLivestock) &&
    relevantClaims.length === 0 &&
    typeOfLivestock === oldWorldClaimTypeOfLivestock

  if (isCattleEndemicsClaimForOldWorldReview) { return `${config.urlPrefix}/${endemicsVetVisitsReviewTestResults}` }

  return `${config.urlPrefix}/${endemicsWhichTypeOfReview}`
}

const getInputErrors = (request, reviewOrFollowUpText, newWorldApplication) => {
  const dateSchema = joi.object({
    'visit-date-day': joi.number().max(MAX_POSSIBLE_DAY),
    'visit-date-month': joi.number().max(MAX_POSSIBLE_MONTH),
    'visit-date-year': joi.number()
  }).options({ abortEarly: false }) // needed otherwise it doesnt check other fields if an error is found

  const { error } = dateSchema.validate(request.payload)

  const inputsInError = {
    day: false,
    month: false,
    year: false
  }

  const inputKeysInError = error?.details?.map(({ context }) => context.key) || []

  Object.keys(inputsInError).forEach(input => {
    if (inputKeysInError.includes(`visit-date-${input}`)) {
      inputsInError[input] = true
    }
  })

  if (inputKeysInError.length > 0) {
    const inputNameInError = inputKeysInError[0]
    return {
      errorSummary: [{
        text: `Enter the date of ${reviewOrFollowUpText}`,
        href: `#${inputNameInError}`
      }],
      inputsInError
    }
  }

  const [day, month, year] = Object.values(request.payload)
  const dateEnteredIsValid = isValidDate(Number(year), Number(month), Number(day))
  const visitDateDayHref = '#visit-date-day'

  if (!dateEnteredIsValid) {
    return {
      errorSummary: [{
        text: `The date of ${reviewOrFollowUpText} must be a real date`,
        href: visitDateDayHref
      }],
      inputsInError: { day: true, month: true, year: true }
    }
  }

  const now = new Date()
  const dateOfVisit = new Date(year, month - 1, day)

  if (dateOfVisit > now) {
    return {
      errorSummary: [{
        text: `The date of ${reviewOrFollowUpText} must be today or in the past`,
        href: visitDateDayHref
      }],
      inputsInError: { day: true, month: true, year: true }
    }
  }

  const applicationCreatedTime = new Date(newWorldApplication.createdAt).setHours(0, 0, 0, 0)

  if (applicationCreatedTime > dateOfVisit.getTime()) {
    return {
      errorSummary: [{
        text: `The date of ${reviewOrFollowUpText} must be the same as or after the date of your agreement`,
        href: visitDateDayHref
      }],
      inputsInError: { day: true, month: true, year: true }
    }
  }

  return {
    errorSummary: [],
    inputsInError: { day: false, month: false, year: false }
  }
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { dateOfVisit, typeOfReview, latestVetVisitApplication: oldWorldApplication, previousClaims, typeOfLivestock } =
        getEndemicsClaim(request)
      const { isReview } = getReviewType(typeOfReview)
      const reviewOrFollowUpText = isReview ? 'review' : 'follow-up'

      return h.view(`${endemicsDateOfVisit}`, {
        reviewOrFollowUpText,
        dateOfVisit: {
          day: dateOfVisit ? new Date(dateOfVisit).getDate() : '',
          month: dateOfVisit ? new Date(dateOfVisit).getMonth() + 1 : '',
          year: dateOfVisit ? new Date(dateOfVisit).getFullYear() : ''
        },
        backLink: previousPageUrl(oldWorldApplication, typeOfReview, previousClaims, typeOfLivestock)
      })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const endemicsClaim = getEndemicsClaim(request)
      const {
        typeOfReview: typeOfClaim,
        previousClaims,
        latestVetVisitApplication: oldWorldApplication,
        typeOfLivestock,
        organisation,
        reference: tempClaimReference,
        latestEndemicsApplication: newWorldApplication,
        tempHerdId: tempHerdIdFromSession
      } = endemicsClaim

      const { isDairy } = getLivestockTypes(typeOfLivestock)
      const { isReview, isEndemicsFollowUp } = getReviewType(typeOfClaim)
      const reviewOrFollowUpText = isReview ? 'review' : 'follow-up'

      const { errorSummary, inputsInError } = getInputErrors(request, reviewOrFollowUpText, newWorldApplication)

      if (errorSummary.length) {
        const data = {
          reviewOrFollowUpText,
          errorSummary,
          dateOfVisit: {
            day: request.payload[labels.day],
            month: request.payload[labels.month],
            year: request.payload[labels.year]
          },
          backLink: previousPageUrl(oldWorldApplication, typeOfClaim, previousClaims, typeOfLivestock),
          inputsInError
        }

        appInsights.defaultClient.trackEvent({
          name: 'claim-invalid-date-of-visit',
          properties: {
            tempClaimReference,
            dateOfAgreement: newWorldApplication.createdAt.toLocaleDateString('en-GB')
              .split('/')
              .reverse()
              .join('-'),
            dateEntered: `${data.dateOfVisit.year}-${data.dateOfVisit.month}-${data.dateOfVisit.day}`,
            journeyType: reviewOrFollowUpText,
            error: errorSummary[0].text
          }
        })

        return h.view(`${endemicsDateOfVisit}`, data).code(HttpStatus.BAD_REQUEST).takeover()
      }

      const dateOfVisit = new Date(request.payload[labels.year], request.payload[labels.month] - 1, request.payload[labels.day])
      setEndemicsClaim(request, dateOfVisitKey, dateOfVisit)

      const timingExceptionRedirect = checkForTimingException(request, h, { dateOfVisit, typeOfLivestock, previousClaims, isDairy, isEndemicsFollowUp })
      if (timingExceptionRedirect) {
        return timingExceptionRedirect
      }

      if (isMultipleHerdsUserJourney(dateOfVisit, newWorldApplication.flags)) {
        const tempHerdId = getTempHerdId(request, tempHerdIdFromSession)
        setEndemicsClaim(request, tempHerdIdKey, tempHerdId, { shouldEmitEvent: false })
        const herds = await getHerds(newWorldApplication.reference, typeOfLivestock, request.logger)
        setEndemicsClaim(request, herdsKey, herds, { shouldEmitEvent: false })

        if (herds.length) {
          return h.redirect(`${config.urlPrefix}/${endemicsSelectTheHerd}`)
        }

        setEndemicsClaim(request, herdIdKey, tempHerdId, { shouldEmitEvent: false })
        setEndemicsClaim(request, herdVersionKey, 1, { shouldEmitEvent: false })
        return h.redirect(`${config.urlPrefix}/${endemicsEnterHerdName}`)
      }

      return nonMhRouting(request, h, {
        endemicsClaim,
        previousClaims,
        oldWorldApplication,
        typeOfLivestock,
        typeOfClaim,
        dateOfVisit,
        reviewOrFollowUpText,
        organisation
      })
    }
  }
}

const checkForTimingException = (request, h, { dateOfVisit, typeOfLivestock, previousClaims, isDairy, isEndemicsFollowUp }) => {
  let exception
  let exceptionView

  const claimIsDairyAndIsFollowUpAndHappenedBeforePIReleased = isDairy && isEndemicsFollowUp && dateOfVisit < PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE

  if (claimIsDairyAndIsFollowUpAndHappenedBeforePIReleased) {
    exception = `User is attempting to claim for dairy follow-up with a date of visit of ${dateOfVisit} which is before dairy follow-ups was enabled.`
    exceptionView = endemicsDairyFollowUpDateException
  }

  if (!claimIsDairyAndIsFollowUpAndHappenedBeforePIReleased && isMSClaimBeforeMSRelease(previousClaims, typeOfLivestock, dateOfVisit)) {
    exception = `User is attempting to claim for MS with a date of visit of ${dateOfVisit} which is before MS was enabled.`
    exceptionView = endemicsMultipleSpeciesDateException
  }

  if (exception) {
    raiseInvalidDataEvent(request, dateOfVisitKey, exception)

    return h
      .view(exceptionView, { backLink: pageUrl })
      .code(HttpStatus.BAD_REQUEST)
      .takeover()
  }

  return undefined
}

const nonMhRouting = (request, h, { endemicsClaim, previousClaims, oldWorldApplication, typeOfLivestock, typeOfClaim, dateOfVisit, reviewOrFollowUpText, organisation }) => {
  // all the below only applies when user rejects T&Cs or the visit date is pre-MH golive
  removeMultipleHerdsSessionData(request, endemicsClaim)

  const claimsForFirstHerdIfPreMH = getAllClaimsForFirstHerd(previousClaims, typeOfLivestock)

  // duplicated from which-type-of-review-ms
  // we don't know if postMH claims can be used for follow-up until date entered
  if (typeOfClaim === 'E' && !getOldWorldClaimFromApplication(oldWorldApplication, typeOfLivestock) && claimsForFirstHerdIfPreMH.length === 0) {
    raiseInvalidDataEvent(
      request,
      typeOfReviewKey,
      'Cannot claim for endemics without a previous review.'
    )

    return h
      .view(`${endemicsWhichTypeOfReviewException}`, {
        backLink: whichTypeOfReviewPageUrl,
        backToPageMessage: 'Tell us if you are claiming for a review or follow up.'
      })
      .code(HttpStatus.BAD_REQUEST)
      .takeover()
  }

  const errorMessage = canMakeClaim({ prevClaims: claimsForFirstHerdIfPreMH, typeOfReview: typeOfClaim, dateOfVisit, organisation, typeOfLivestock, oldWorldApplication })

  if (errorMessage) {
    raiseInvalidDataEvent(
      request,
      dateOfVisitKey,
      `Value ${dateOfVisit} is invalid. Error: ${errorMessage}`
    )

    return h
      .view(`${endemicsDateOfVisitException}`, {
        backLink: pageUrl,
        errorMessage,
        backToPageMessage: `Enter the date the vet last visited your farm for this ${reviewOrFollowUpText}.`
      })
      .code(HttpStatus.BAD_REQUEST)
      .takeover()
  }

  return h.redirect(getNextMultipleHerdsPage(request))
}

export const dateOfVisitHandlers = [getHandler, postHandler]
