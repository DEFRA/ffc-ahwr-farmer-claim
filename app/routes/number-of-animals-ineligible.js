const getHandler = {
  method: 'GET',
  path: '/claim/number-of-animals-ineligible',
  options: {
    handler: async (_, h) => {
      return h.view('number-of-animals-ineligible', {})
    }
  }
}

module.exports = { handlers: [getHandler] }
