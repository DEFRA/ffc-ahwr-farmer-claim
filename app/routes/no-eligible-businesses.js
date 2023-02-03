module.exports = {
  method: 'GET',
  path: '/claim/no-eligible-businesses',
  options: {
    handler: async (request, h) => {
      return h.view('no-eligible-businesses')
    }
  }
}
