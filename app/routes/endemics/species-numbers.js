const Joi = require('joi')
const boom = require('@hapi/boom')
const urlPrefix = require('../../config').urlPrefix
const session = require('../../session')
const raiseInvalidDataEvent = require('../../event/raise-invalid-data-event')
const config = require('../../config')
const {
  endemicsSpeciesNumbers,
  endemicsNumberOfSpeciesTested,
  endemicsSpeciesNumbersException,
  endemicsVetName,
  endemicsDateOfTesting,
  endemicsDateOfVisit
} = require('../../config/routes')
const { getReviewType } = require('../../lib/get-review-type')
const { getYesNoRadios } = require('../models/form-component/yes-no-radios')
const { speciesNumbers } = require('../../session/keys').endemicsClaim
const { getSpeciesEligibleNumberForDisplay } = require('../../lib/display-helpers')
const { getLivestockTypes } = require('../../lib/get-livestock-types')
const { getTestResult } = require('../../lib/get-test-result')
const {optionalPIHunt} = require('../../config')

const backLink = (request) => {
  const { reviewTestResults, typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)
  const { isEndemicsFollowUp } = getReviewType(typeOfReview)
  const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)
  const { isNegative } = getTestResult(reviewTestResults)

  if ((isDairy || isBeef) && isNegative) return `${urlPrefix}/${endemicsDateOfVisit}`
  if(optionalPIHunt.enabled && isEndemicsFollowUp && (isBeef || isDairy )) {
    return `${urlPrefix}/${endemicsDateOfVisit}`
  }

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
const errorMessageText = (typeOfReview, speciesEligbileNumberForDisplay) => {
  const { isReview } = getReviewType(typeOfReview)
  return `Select if you had ${speciesEligbileNumberForDisplay} on the date of the ${isReview ? 'review' : 'follow-up'}.`
}
const legendText = (speciesEligbileNumberForDisplay, typeOfReview) => {
  const { isReview } = getReviewType(typeOfReview)
  return `Did you have ${speciesEligbileNumberForDisplay} on the date of the ${isReview ? 'review' : 'follow-up'}?`
}

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const claim = session.getEndemicsClaim(request)
        if (!claim) {
          return boom.notFound()
        }
        const speciesEligbileNumberForDisplay = getSpeciesEligibleNumberForDisplay(claim, isEndemicsClaims)

        return h.view(endemicsSpeciesNumbers, {
          backLink: backLink(request),
          ...getYesNoRadios(
            legendText(speciesEligbileNumberForDisplay, claim?.typeOfReview),
            speciesNumbers,
            session.getEndemicsClaim(request, speciesNumbers),
            undefined,
            radioOptions
          )
        })
      }
    }
  },
  {
    method: 'POST',
    path: pageUrl,
    options: {
      validate: {
        payload: Joi.object({
          [speciesNumbers]: Joi.string().valid('yes', 'no').required()
        }),
        failAction: (request, h, _err) => {
          const claim = session.getEndemicsClaim(request)
          if (!claim) {
            return boom.notFound()
          }
          const speciesEligbileNumberForDisplay = getSpeciesEligibleNumberForDisplay(claim, isEndemicsClaims)
          return h.view(endemicsSpeciesNumbers, {
            backLink: backLink(request),
            errorMessage: { text: errorMessageText(claim?.typeOfReview, speciesEligbileNumberForDisplay) },
            ...getYesNoRadios(
              legendText(speciesEligbileNumberForDisplay, claim?.typeOfReview),
              speciesNumbers,
              session.getEndemicsClaim(request, speciesNumbers),
              errorMessageText(claim?.typeOfReview, speciesEligbileNumberForDisplay),
              radioOptions
            )
          })
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const { typeOfLivestock, typeOfReview } = session.getEndemicsClaim(request)
        const { isBeef, isDairy } = getLivestockTypes(typeOfLivestock)
        const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)

        const answer = request.payload[speciesNumbers]
        session.setEndemicsClaim(request, speciesNumbers, answer)

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
]
