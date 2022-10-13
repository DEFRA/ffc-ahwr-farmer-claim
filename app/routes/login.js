const boom = require('@hapi/boom')
const Joi = require('joi')
const { getByEmail } = require('../api-requests/users')
const { getClaim } = require('../messaging/application')
const { email: emailValidation } = require('../lib/validation/email')
const { sendFarmerClaimLoginMagicLink } = require('../lib/email/send-magic-link-email')
const { setClaim, clear } = require('../session')
const { sendMonitoringEvent } = require('../event')

const hintText = 'We\'ll use this to send you a link to claim funding for a review'

function cacheClaim (claim, request) {
  Object.entries(claim).forEach(([k, v]) => setClaim(request, k, v))
}

module.exports = [{
  method: 'GET',
  path: '/claim/login',
  options: {
    auth: {
      mode: 'try'
    },
    plugins: {
      'hapi-auth-cookie': {
        redirectTo: false
      }
    },
    handler: async (request, h) => {
      if (request.auth.isAuthenticated) {
        return h.redirect(request.query?.next || '/claim/visit-review')
      }

      return h.view('login', { hintText })
    }
  }
},
{
  method: 'POST',
  path: '/claim/login',
  options: {
    auth: {
      mode: 'try'
    },
    validate: {
      payload: Joi.object({
        email: emailValidation
      }),
      failAction: async (request, h, error) => {
        const { email } = request.payload
        sendMonitoringEvent(request.yar.id, error.details[0].message, email)
        return h.view('login', { ...request.payload, errorMessage: { text: error.details[0].message }, hintText }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { email } = request.payload
      const organisation = await getByEmail(email)

      if (!organisation) {
        sendMonitoringEvent(request.yar.id, `No user found with email address "${email}"`, email)
        return h.view('login', { ...request.payload, errorMessage: { text: `No user found with email address "${email}"` }, hintText }).code(400).takeover()
      }

      const claim = await getClaim(email, request.yar.id)

      if (!claim) {
        sendMonitoringEvent(request.yar.id, `No application found for ${email}.`, email)
        return h.view('login', { ...request.payload, errorMessage: { text: `No application found for ${email}. Please call the Rural Payments Agency on 03000 200 301 if you believe this is an error.`, hintText } }).code(400).takeover()
      }

      clear(request)
      cacheClaim(claim, request)
      const result = await sendFarmerClaimLoginMagicLink(request, email)

      if (!result) {
        return boom.internal()
      }

      return h.view('check-email', { activityText: 'The email includes a link to apply for a review. This link will expire in 15 minutes.', email })
    }
  }
}]
