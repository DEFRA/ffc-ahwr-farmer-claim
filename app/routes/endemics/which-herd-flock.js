const Joi = require('joi')
const { herdFlock } = require('../session/keys').claim
const { herdFlockRadios } = require('./models/form-component/herdFlock-radio')
const session = require('../session')
const urlPrefix = require('../config/index').urlPrefix

const legendText = 'Which herd are you claiming for?'
const errorText = 'Select the livestock type you want reviewed'
const hintHtml = `<p>You can have one review every 10 months for one type of livestock.</p>
<p>If you’re eligible for more than one type of livestock, you must choose which one you want reviewed.</p>`
const backLink = `${urlPrefix}/org-review`
const radioOptions = { isPageHeading: true, legendClasses: 'govuk-fieldset__legend--l', inline: false, hintHtml }

module.exports = [
  {
    method: 'GET',
    path: `${urlPrefix}/which-herd-flock`,
    options: {
      handler: async (request, h) => {
        return h.view('which-herd-flock', {
          ...herdFlockRadios(legendText, herdFlock, session.getClaim(request, herdFlock), undefined, radioOptions),
          backLink
        })
      }
    }
  },
  {
    method: 'POST',
    path: `${urlPrefix}/which-herd-flock`,
    options: {
      validate: {
        payload: Joi.object({
          [herdFlock]: Joi.string().valid('sheep', 'pigs', 'dairy', 'beef').required()
        }),
        failAction: (request, h, _err) => {
          return h.view('which-herd-flock', {
            ...herdFlockRadios(legendText, herdFlock, session.getClaim(request, herdFlock), errorText, radioOptions),
            backLink
          }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        session.setClaim(request, herdFlock, request.payload[herdFlock])
        return h.redirect(`${urlPrefix}/${request.payload[herdFlock]}-eligibility`)
      }
    }
  }
]
