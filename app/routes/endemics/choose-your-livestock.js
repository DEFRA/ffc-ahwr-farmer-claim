const Joi = require('joi')
const { species } = require('../session/keys').claim
const { speciesRadios } = require('./models/form-component/species-radio')
const session = require('../session')
const urlPrefix = require('../config/index').urlPrefix

const legendText = 'Choose your livestock?'
const errorText = 'Select the livestock type you want reviewed'
const hintHtml = `<p>You can have one review every 10 months for one type of livestock.</p>
<p>If you’re eligible for more than one type of livestock, you must choose which one you want reviewed.</p>`
const backLink = `${urlPrefix}/org-review`
const radioOptions = { isPageHeading: true, legendClasses: 'govuk-fieldset__legend--l', inline: false, hintHtml }

module.exports = [
  {
    method: 'GET',
    path: `${urlPrefix}/choose-your-livestock`,
    options: {
      handler: async (request, h) => {
        return h.view('choose-your-livestock', {
          ...speciesRadios(legendText, species, session.getClaim(request, species), undefined, radioOptions),
          backLink
        })
      }
    }
  },
  {
    method: 'POST',
    path: `${urlPrefix}/choose-your-livestock`,
    options: {
      validate: {
        payload: Joi.object({
          [species]: Joi.string().valid('sheep', 'pigs', 'dairy', 'beef').required()
        }),
        failAction: (request, h, _err) => {
          return h.view('choose-your-livestock', {
            ...speciesRadios(legendText, species, session.getClaim(request, species), errorText, radioOptions),
            backLink
          }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        session.setClaim(request, species, request.payload[species])
        return h.redirect(`${urlPrefix}/${request.payload[species]}-eligibility`)
      }
    }
  }
]
