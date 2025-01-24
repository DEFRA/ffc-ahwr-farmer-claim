const { claimDashboard } = require('../config/routes')
const session = require('../session')

const redirectReferenceMissing = async (request, h) => {
  const { reference } = session.getEndemicsClaim(request) || {}
  if (!reference) {
    return h.redirect(claimDashboard).takeover()
  }
  return h.continue
}

module.exports = {
  redirectReferenceMissing
}