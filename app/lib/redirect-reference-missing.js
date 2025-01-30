const { claimDashboard } = require('../config/routes')
const session = require('../session')

const redirectReferenceMissing = async (request, h) => {
  const claim = session.getEndemicsClaim(request)
  if (!claim?.reference) {
    return h.redirect(claimDashboard).takeover()
  }
  return h.continue
}

module.exports = {
  redirectReferenceMissing
}
