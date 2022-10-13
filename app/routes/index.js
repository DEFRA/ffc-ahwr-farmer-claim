const { clear } = require('../session')

module.exports = {
  method: 'GET',
  path: '/claim',
  options: {
    auth: false,
    handler: async (request, h) => {
      request.cookieAuth.clear()
      clear(request)
      return h.view('index')
    }
  }
}
