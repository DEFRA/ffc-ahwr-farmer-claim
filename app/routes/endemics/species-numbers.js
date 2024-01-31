const Joi = require('joi')
const boom = require('@hapi/boom')
const urlPrefix = require('../../config').urlPrefix
const session = require('../../session')
const {
  speciesNumbersUrl,
  eligibility,
  ineligibility,
  vetName
} = require('../../config/routes')
const { getYesNoRadios } = require('../models/form-component/yes-no-radios')
const { speciesNumbers } = require('../../session/keys').endemicsClaim
const { getSpeciesEligbileNumberForDisplay } = require('../../lib/display-helpers')

const pageUrl = `${urlPrefix}/${speciesNumbersUrl}`
const hintHtml = '<p>You can find this on the summary the vet gave you.</p>'
const legendText = 'Did you have $ on the date of the review?'
const radioOptions = { isPageHeading: true, legendClasses: 'govuk-fieldset__legend--l', inline: true, hintHtml }
const errorMessageText = 'Select a response'
const isEndemicsClaims = true

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
        const speciesEligbileNumberForDisplay = getSpeciesEligbileNumberForDisplay(claim, isEndemicsClaims)
        return h.view(
          speciesNumbersUrl, {
            ...getYesNoRadios(legendText.replace('$', speciesEligbileNumberForDisplay), speciesNumbers, session.getEndemicsClaim(request, speciesNumbers), undefined, radioOptions)
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
          const speciesEligbileNumberForDisplay = getSpeciesEligbileNumberForDisplay(claim, isEndemicsClaims)
          return h.view(
            speciesNumbersUrl,
            {
              errorMessage: { text: errorMessageText },
              ...getYesNoRadios(legendText.replace('$', speciesEligbileNumberForDisplay), speciesNumbers, session.getEndemicsClaim(request, speciesNumbers), errorMessageText, radioOptions)
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
            return h.redirect(`${urlPrefix}/${vetName}`)
          }
          return h.redirect(`${urlPrefix}/${eligibility}`)
        }
        return h.redirect(`${urlPrefix}/${ineligibility}`)
      }
    }
  }
]
