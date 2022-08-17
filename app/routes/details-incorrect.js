module.exports = {
  method: 'GET',
  path: '/details-incorrect',
  options: {
    handler: async (_, h) => {
      return h.view('details-incorrect')
    }
  }
}
