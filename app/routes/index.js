module.exports = {
  method: 'GET',
  path: '/',
  options: {
    auth: false,
    handler: async (_, h) => {
      return h.view('index')
    }
  }
}
