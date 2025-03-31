export const devSignInRedirectPlugin = {
  plugin: {
    name: 'dev-sign-in-redirect',
    register: (server, _) => {
      server.ext('onPreResponse', (request, h) => {
        if (request.path === '/claim/endemics/dev-sign-in') {
          const response = h.request.response
          response.headers['content-security-policy'] = response.headers['content-security-policy'].replace("form-action 'self'", 'form-action *')
        }
        return h.request.response
      })
    }
  }
}
