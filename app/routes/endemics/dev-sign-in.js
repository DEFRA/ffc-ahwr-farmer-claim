const urlPrefix = require('../../config').urlPrefix

const pageUrl = `${urlPrefix}/endemics/dev-sign-in`

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    auth: false,
    handler: async (request, h) => {
      return h.view('endemics/dev-sign-in', {
      })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    auth: false,
    handler: async (request, h) => {
      const { sbi } = request.payload

      return h.redirect(`/claim/signin-oidc?code=${sbi}&state=dev&devLogin=true`)
    }
  }
}

module.exports = { handlers: [getHandler, postHandler] }
