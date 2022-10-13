const Joi = require('joi')
const boom = require('@hapi/boom')
const { getClaim, setClaim } = require('../session')
const getClaimViewData = require('./models/claim')
const { detailsCorrect } = require('../session/keys').claim

const errorMessage = 'Select yes if these details are correct'

module.exports = [{
  method: 'GET',
  path: '/claim/visit-review',
  options: {
    handler: async (request, h) => {
      const claim = getClaim(request)

      if (!claim) {
        return boom.notFound()
      }

      return h.view('visit-review', getClaimViewData(claim))
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
        const claim = getClaim(request)
        return h.view('visit-review', getClaimViewData(claim, errorMessage)).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const answer = request.payload[detailsCorrect]
      setClaim(request, detailsCorrect, answer)
      if (answer === 'yes') {
        return h.redirect('/claim/vet-visit-date')
      }
      return h.redirect('/claim/details-incorrect')
    }
  }
}]
