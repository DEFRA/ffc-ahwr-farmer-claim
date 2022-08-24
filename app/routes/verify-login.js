const Joi = require('joi')
const { lookupToken, setAuthCookie } = require('../auth')

function isRequestInvalid (cachedEmail, email) {
  return !cachedEmail || email !== cachedEmail
}

module.exports = [{
  method: 'GET',
  path: '/verify-login',
  options: {
    auth: false,
    validate: {
      query: Joi.object({
        email: Joi.string().email(),
        token: Joi.string().uuid().required()
      }),
      failAction: async (_, h, error) => {
        console.error(error)
        return h.view('auth/verify-login-failed').code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { email, token } = request.query

      const { email: cachedEmail, redirectTo, userType } = await lookupToken(request, token)
      if (isRequestInvalid(cachedEmail, email)) {
        return h.view('auth/verify-login-failed').code(400)
      }

      setAuthCookie(request, email, userType)

      return h.redirect(redirectTo)
    }
  }
}]
