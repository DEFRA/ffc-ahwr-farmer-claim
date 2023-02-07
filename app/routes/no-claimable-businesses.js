module.exports = {
  method: 'GET',
  path: '/claim/no-claimable-businesses',
  options: {
    handler: async (request, h) => {
      return h.view('no-claimable-businesses')
    }
  }
}
