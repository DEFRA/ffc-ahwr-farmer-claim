const config = require('../config')

module.exports = {
  plugin: require('@hapi/crumb'),
  options: {
    cookieOptions: {
      isSecure: config.cookie.isSecure
    },
    skip: (request) => request.route.path === `${config.urlPrefix}/cookies` && request.method.toLowerCase() === 'post'
  }
}
