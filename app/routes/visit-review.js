const Joi = require('joi')
const boom = require('@hapi/boom')
const { getClaim, setClaim } = require('../session')
const getClaimViewData = require('./models/claim')
const { detailsCorrect } = require('../session/keys').claim
const { farmerApplyData } = require('../session/keys')
const { setApplication } = require('../session')
const { getApplication } = require('../api-requests/applications')

const errorMessage = 'Select yes if these details are correct'

module.exports = [{
  method: 'GET',
  path: '/visit-review',
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
  path: '/visit-review',
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
        const reference = 'VV-7279-0CF6'
        const application = await getApplication(reference)
        setApplication(request, farmerApplyData.whichReview, application.data.whichReview)
        return h.redirect(`/vaccination-status`)
      }
      return h.redirect('/details-incorrect')
    }
  }
}]
