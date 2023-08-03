module.exports = {
  plugin: {
    name: 'header',
    register: (server, options) => {
      server.ext('onPreResponse', (request, h) => {
        const response = request.response
        options?.keys?.forEach(x => {
          response.header(x.key, x.value)
        })
        return h.continue
      })
    }
  }
}
