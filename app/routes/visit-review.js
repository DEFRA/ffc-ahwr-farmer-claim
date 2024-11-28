const Joi = require('joi')
const boom = require('@hapi/boom')
const session = require('../session')
const auth = require('../auth')
const getClaimViewData = require('./models/claim')
const { detailsCorrect } = require('../session/keys').claim

const errorMessage = 'Select yes if these details are correct'

const getHandler = {
  method: 'GET',
  path: '/claim/visit-review',
  options: {
    handler: async (request, h) => {
      const claim = session.getClaim(request)

      if (!claim) {
        return boom.notFound()
      }

      return h.view('visit-review', getClaimViewData(claim, generateBackLink(request)))
    }
  }
}

const postHandler = {
  method: 'POST',
  path: '/claim/visit-review',
  options: {
    validate: {
      payload: Joi.object({
        [detailsCorrect]: Joi.string().valid('yes', 'no').required()
      }),
      failAction: (request, h, err) => {
        request.logger.setBindings({ err })
        const claim = session.getClaim(request)
        return h.view('visit-review', getClaimViewData(claim, generateBackLink(request), errorMessage)).code(400).takeover()
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
}

function generateBackLink (request) {
  return auth.requestAuthorizationCodeUrl(session, request)
}

module.exports = { handlers: [getHandler, postHandler] }
