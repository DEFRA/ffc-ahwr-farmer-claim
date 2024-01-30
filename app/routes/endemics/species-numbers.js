const Joi = require('joi')
const boom = require('@hapi/boom')
const session = require('../../session')
const { getYesNoRadios } = require('../models/form-component/yes-no-radios')
const { speciesNumbers } = require('../../session/keys').endemicsClaim
const { getSpeciesEligbileNumberForDisplay } = require('../../lib/display-helpers')

const pageUrl = 'endemics/species-numbers'
const eligiblePageUrl = 'eligible'
const ineligiblePageUrl = 'ineligible'
const hintHtml = '<p>You can find this on the summary the vet gave you.</p>'
const legendText = 'Did you have $ on the date of the review?'
const radioOptions = { isPageHeading: true, legendClasses: 'govuk-fieldset__legend--l', inline: true, hintHtml }
const errorMessageText = 'Select a response'
const isEndemicsClaims = true

module.exports = [
  {
    method: 'GET',
    path: `/claim/${pageUrl}`,
    options: {
      handler: async (request, h) => {
        const claim = session.getEndemicsClaim(request)
        if (!claim) {
          return boom.notFound()
        }
        const speciesEligbileNumberForDisplay = getSpeciesEligbileNumberForDisplay(claim, isEndemicsClaims)
        return h.view(
          'endemics/species-numbers', {
            ...getYesNoRadios(legendText.replace('$', speciesEligbileNumberForDisplay), speciesNumbers, session.getEndemicsClaim(request, speciesNumbers), undefined, radioOptions)
          }
        )
      }
    }
  },
  {
    method: 'POST',
    path: `/claim/${pageUrl}`,
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
            'endemics/species-numbers',
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
        if (answer === 'yes') {
          session.setEndemicsClaim(request, speciesNumbers, request.payload[speciesNumbers])
          return h.redirect(eligiblePageUrl)
        }
        return h.redirect(ineligiblePageUrl)
      }
    }
  }
]
