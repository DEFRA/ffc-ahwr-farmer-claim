const Joi = require('joi')
const boom = require('@hapi/boom')
const urlPrefix = require('../../config').urlPrefix
const session = require('../../session')
const config = require('../../config')
const {
  endemicsSpeciesNumbers,
  endemicsNumberOfSpeciesTested,
  endemicsSpeciesNumbersException,
  endemicsVetName,
  endemicsDateOfTesting
} = require('../../config/routes')
const { getYesNoRadios } = require('../models/form-component/yes-no-radios')
const { speciesNumbers } = require('../../session/keys').endemicsClaim
const { getSpeciesEligibleNumberForDisplay } = require('../../lib/display-helpers')
const { claimType } = require('../../constants/claim')
const backLink = `${urlPrefix}/${endemicsDateOfTesting}`

const pageUrl = `${urlPrefix}/${endemicsSpeciesNumbers}`
const hintHtml = '<p>You can find this on the summary the vet gave you.</p>'
const legendText = 'Did you have $ on the date of the'
const radioOptions = { isPageHeading: true, legendClasses: 'govuk-fieldset__legend--l', inline: true, hintHtml }
const errorMessageText = 'Select yes or no'
const isEndemicsClaims = true

const generateLegendText = (legendText, typeOfReview) => {
  return `${legendText} ${typeOfReview === claimType.review ? 'review' : 'follow-up'}?`
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
        return h.view(
          endemicsSpeciesNumbers, {
            backLink,
            ...getYesNoRadios(generateLegendText(legendText.replace('$', speciesEligbileNumberForDisplay), claim?.typeOfReview), speciesNumbers, session.getEndemicsClaim(request, speciesNumbers), undefined, radioOptions)
          }
        )
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
          return h.view(
            endemicsSpeciesNumbers,
            {
              backLink,
              errorMessage: { text: errorMessageText },
              ...getYesNoRadios(generateLegendText(legendText.replace('$', speciesEligbileNumberForDisplay), claim?.typeOfReview), speciesNumbers, session.getEndemicsClaim(request, speciesNumbers), errorMessageText, radioOptions)
            }
          )
            .code(400)
            .takeover()
        }
      },
      handler: async (request, h) => {
        const answer = request.payload[speciesNumbers]
        const claim = session.getEndemicsClaim(request)
        session.setEndemicsClaim(request, speciesNumbers, request.payload[speciesNumbers])

        if (answer === 'yes') {
          if (claim.typeOfLivestock === 'dairy') {
            return h.redirect(`${urlPrefix}/${endemicsVetName}`)
          }
          return h.redirect(`${urlPrefix}/${endemicsNumberOfSpeciesTested}`)
        }
        return h.view(endemicsSpeciesNumbersException, { backLink: pageUrl, ruralPaymentsAgency: config.ruralPaymentsAgency }).code(400).takeover()
      }
    }
  }
]
