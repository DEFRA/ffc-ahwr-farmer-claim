
const pageUrl = 'endemics/ineligible'
const backLink = 'species-numbers'

module.exports = {
  method: 'GET',
  path: `/claim/${pageUrl}`,
  options: {
    handler: async (_, h) => {
      return h.view(pageUrl, { backLink })
    }
  }
}
