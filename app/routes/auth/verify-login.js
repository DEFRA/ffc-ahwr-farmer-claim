const Joi = require('joi')
const { lookupToken, setAuthCookie } = require('../../auth')
const { sendMonitoringEvent } = require('../../event')
const config = require('../../../app/config')

function isRequestInvalid (cachedEmail, email) {
  return typeof cachedEmail === 'undefined' || email !== cachedEmail
}

const getIp = (request) => {
  const xForwardedForHeader = request.headers['x-forwarded-for']
  return xForwardedForHeader ? xForwardedForHeader.split(',')[0] : request.info.remoteAddress
}

module.exports = [{
  method: 'GET',
  path: '/claim/verify-login',
  options: {
    auth: false,
    validate: {
      query: Joi.object({
        email: Joi.string().email(),
        token: Joi.string().uuid().required()
      }),
      failAction: async (request, h, error) => {
        console.log(`Request to /claim/verify-login failed: ${JSON.stringify({
          id: request.yar.id,
          query: request.query,
          errorMessage: error.message
        })}`)
        sendMonitoringEvent(request.yar.id, error.details[0].message, '', getIp(request))
        return h.view('verify-login-failed', {
          backLink: 'claim/login',
          ruralPaymentsAgency: config.ruralPaymentsAgency
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      console.log(`Request to /claim/verify-login: ${JSON.stringify({
        id: request.yar.id,
        query: request.query
      })}`)

      const { email, token } = request.query

      const { email: cachedEmail, redirectTo, userType } = await lookupToken(request, token)
      if (isRequestInvalid(cachedEmail, email)) {
        sendMonitoringEvent(request.yar.id, 'Invalid token', email, getIp(request))
        return h.view('verify-login-failed', {
          backLink: 'claim/login',
          ruralPaymentsAgency: config.ruralPaymentsAgency
        }).code(400).takeover()
      }

      setAuthCookie(request, email, userType)

      return h.redirect(redirectTo)
    }
  }
}]
