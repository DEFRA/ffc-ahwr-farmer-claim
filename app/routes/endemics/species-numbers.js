import Joi from 'joi'
import boom from '@hapi/boom'
import { config } from '../../config/index.js'
import links from '../../config/routes.js'
import { sessionKeys } from '../../session/keys.js'
import { getReviewType } from '../../lib/get-review-type.js'
import { getEndemicsClaim, setEndemicsClaim } from '../../session/index.js'
import { getSpeciesEligibleNumberForDisplay } from '../../lib/display-helpers.js'
import { getYesNoRadios } from '../models/form-component/yes-no-radios.js'
import { raiseInvalidDataEvent } from '../../event/raise-invalid-data-event.js'
import { getLivestockTypes } from '../../lib/get-livestock-types.js'
import { getTestResult } from '../../lib/get-test-result.js'
import { isPIHuntEnabledAndVisitDateAfterGoLive } from '../../lib/context-helper.js'

const { urlPrefix } = config

const {
  endemicsSpeciesNumbers,
  endemicsNumberOfSpeciesTested,
  endemicsSpeciesNumbersException,
  endemicsVetName,
  endemicsDateOfTesting,
  endemicsDateOfVisit
} = links
const { speciesNumbers, dateOfVisit: dateOfVisitKey } = sessionKeys.endemicsClaim

const backLink = (request) => {
  const { reviewTestResults, typeOfLivestock, typeOfReview } = getEndemicsClaim(request)
  const { isEndemicsFollowUp } = getReviewType(typeOfReview)
  const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)
  const { isNegative } = getTestResult(reviewTestResults)

  if (isPIHuntEnabledAndVisitDateAfterGoLive(getEndemicsClaim(request, dateOfVisitKey)) && isEndemicsFollowUp && (isBeef || isDairy)) {
    return `${urlPrefix}/${endemicsDateOfVisit}`
  }
  if ((isDairy || isBeef) && isNegative) return `${urlPrefix}/${endemicsDateOfVisit}`

  return `${urlPrefix}/${endemicsDateOfTesting}`
}
const pageUrl = `${urlPrefix}/${endemicsSpeciesNumbers}`
const hintHtml = 'You can find this on the summary the vet gave you.'

const radioOptions = { isPageHeading: true, legendClasses: 'govuk-fieldset__legend--l', inline: true, hintText: hintHtml }
const isEndemicsClaims = true
const sheepNumbersExceptionsText = {
  R: 'review',
  E: 'follow-up'
}
const getHerdText = (typeOfLivestock) => typeOfLivestock !== 'sheep' ? 'in this herd' : 'in this flock'
const errorMessageText = (typeOfReview, speciesEligbileNumberForDisplay, typeOfLivestock) => {
  const { isReview } = getReviewType(typeOfReview)
  const claimTypeText = isReview ? 'review' : 'follow-up'
  const herdText = getHerdText(typeOfLivestock)

  return config.multiHerds.enabled
    ? `Select yes if you had ${speciesEligbileNumberForDisplay}${herdText} on the date of the ${claimTypeText}.`
    : `Select if you had ${speciesEligbileNumberForDisplay} on the date of the ${claimTypeText}.`
}
const legendText = (speciesEligbileNumberForDisplay, typeOfReview, typeOfLivestock) => {
  const { isReview } = getReviewType(typeOfReview)
  const claimTypeText = isReview ? 'review' : 'follow-up'
  const herdText = config.multiHerds.enabled ? getHerdText(typeOfLivestock) : ''

  return `Did you have ${speciesEligbileNumberForDisplay}${herdText} on the date of the ${claimTypeText}?`
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const claim = getEndemicsClaim(request)
      if (!claim) {
        return boom.notFound()
      }
      const speciesEligbileNumberForDisplay = getSpeciesEligibleNumberForDisplay(claim, isEndemicsClaims)

      return h.view(endemicsSpeciesNumbers, {
        backLink: backLink(request),
        ...getYesNoRadios(
          legendText(speciesEligbileNumberForDisplay, claim?.typeOfReview, claim?.typeOfLivestock),
          speciesNumbers,
          getEndemicsClaim(request, speciesNumbers),
          undefined,
          radioOptions
        )
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
        [speciesNumbers]: Joi.string().valid('yes', 'no').required()
      }),
      failAction: (request, h, err) => {
        request.logger.setBindings({ err })
        const claim = getEndemicsClaim(request)
        if (!claim) {
          return boom.notFound()
        }
        const speciesEligbileNumberForDisplay = getSpeciesEligibleNumberForDisplay(claim, isEndemicsClaims)
        return h.view(endemicsSpeciesNumbers, {
          backLink: backLink(request),
          errorMessage: { text: errorMessageText(claim?.typeOfReview, speciesEligbileNumberForDisplay, claim?.typeOfLivestock) },
          ...getYesNoRadios(
            legendText(speciesEligbileNumberForDisplay, claim?.typeOfReview, claim?.typeOfLivestock),
            speciesNumbers,
            getEndemicsClaim(request, speciesNumbers),
            errorMessageText(claim?.typeOfReview, speciesEligbileNumberForDisplay, claim?.typeOfLivestock),
            radioOptions
          )
        })
          .code(400)
          .takeover()
      }
    },
    handler: async (request, h) => {
      const { typeOfLivestock, typeOfReview } = getEndemicsClaim(request)
      const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)
      const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)

      const answer = request.payload[speciesNumbers]
      setEndemicsClaim(request, speciesNumbers, answer)

      if (answer === 'yes') {
        if (isDairy || (isBeef && isEndemicsFollowUp)) {
          return h.redirect(`${urlPrefix}/${endemicsVetName}`)
        }

        return h.redirect(`${urlPrefix}/${endemicsNumberOfSpeciesTested}`)
      }

      raiseInvalidDataEvent(request, speciesNumbers, `Value ${answer} is not equal to required value yes`)
      return h.view(endemicsSpeciesNumbersException, { backLink: pageUrl, ruralPaymentsAgency: config.ruralPaymentsAgency, changeYourAnswerText: sheepNumbersExceptionsText[typeOfReview], isReview }).code(400).takeover()
    }
  }
}

export const speciesNumbersHandlers = [getHandler, postHandler]
