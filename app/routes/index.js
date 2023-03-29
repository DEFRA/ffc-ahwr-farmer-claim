const session = require('../session')
const config = require('../config')
const { requestAuthorizationCodeUrl } = require('../auth')

module.exports = {
  method: 'GET',
  path: '/claim',
  options: {
    auth: false,
    handler: async (request, h) => {
      request.cookieAuth.clear()
      session.clear(request)
      if (config.authConfig.defraId.enabled) {
        return h.view('defra-id/index', {
          defraIdLogin: requestAuthorizationCodeUrl(session, request)
        })
      } else {
        return h.view('index')
      }
    }
  }
}
