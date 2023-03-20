const Joi = require('joi')
const boom = require('@hapi/boom')
const session = require('../session')
const config = require('../config')
const auth = require('../auth')
const getClaimViewData = require('./models/claim')
const { detailsCorrect } = require('../session/keys').claim

const errorMessage = 'Select yes if these details are correct'

module.exports = [{
  method: 'GET',
  path: '/claim/visit-review',
  options: {
    handler: async (request, h) => {
      const claim = session.getClaim(request)

      if (!claim) {
        return boom.notFound()
      }

      const backLink = config.authConfig.defraId.enabled ? auth.getAuthenticationUrl(session, request) : `/claim/select-your-business?businessEmail=${claim.data.organisation.email}`
      return h.view('visit-review', getClaimViewData(claim, backLink))
    }
  }
},
{
  method: 'POST',
  path: '/claim/visit-review',
  options: {
    validate: {
      payload: Joi.object({
        [detailsCorrect]: Joi.string().valid('yes', 'no').required()
      }),
      failAction: (request, h, _err) => {
        const claim = session.getClaim(request)
        const backLink = config.authConfig.defraId.enabled ? auth.getAuthenticationUrl(session, request) : `/claim/select-your-business?businessEmail=${claim.data.organisation.email}`
        return h.view('visit-review', getClaimViewData(claim, backLink, errorMessage)).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const answer = request.payload[detailsCorrect]
      session.setClaim(request, detailsCorrect, answer)
      if (answer === 'yes') {
        return h.redirect('/claim/vet-visit-date')
      }
      return h.redirect('/claim/details-incorrect')
    }
  }
}]
