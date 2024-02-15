const session = require('../session')

module.exports = (request) => {
  request.cookieAuth.clear()
  session.clear(request)
}
