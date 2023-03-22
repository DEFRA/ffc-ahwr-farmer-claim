const boom = require('@hapi/boom')
const Joi = require('joi')
const { getByEmail } = require('../../api-requests/users')
const { email: emailValidation } = require('../../lib/validation/email')
const { sendFarmerClaimLoginMagicLink } = require('../../lib/email/send-magic-link-email')
const { sendMonitoringEvent } = require('../../event')

const hintText = 'We\'ll use this to send you a link to claim funding for a review. This must be the business email address linked to the business claiming for a review.'

const getIp = (request) => {
  const xForwardedForHeader = request.headers['x-forwarded-for']
  return xForwardedForHeader ? xForwardedForHeader.split(',')[0] : request.info.remoteAddress
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
        const email = request.auth.credentials && request.auth.credentials.email
        return h.redirect(request.query?.next || `/claim/select-your-business?businessEmail=${email}`)
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
        sendMonitoringEvent(request.yar.id, error.details[0].message, email, getIp(request))
        return h.view('login', { ...request.payload, errorMessage: { text: error.details[0].message }, hintText }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { email } = request.payload
      const organisation = await getByEmail(email)

      if (!organisation) {
        console.error(`No user found with email address ${email}`)
        sendMonitoringEvent(request.yar.id, `No user found with email address "${email}"`, email, getIp(request))
        return h.view('login', { ...request.payload, errorMessage: { text: `No user found with email address "${email}"` }, hintText }).code(400).takeover()
      }

      const result = await sendFarmerClaimLoginMagicLink(request, email)

      if (!result) {
        return boom.internal()
      }

      return h.view('check-email', { activityText: 'The email includes a link to apply for a review. This link will expire in 15 minutes.', email })
    }
  }
}]
