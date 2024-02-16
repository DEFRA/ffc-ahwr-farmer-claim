const session = require('../session')

module.exports = (request) => {
  if (request) {
    request.cookieAuth.clear()
    session.clear(request)
  }
}
