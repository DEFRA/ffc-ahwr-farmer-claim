const config = require('../config')

function claimHasExpired (application) {
  const startDate = new Date(application.createdAt)
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + config.claimExpiryTimeMonths)
  endDate.setHours(23, 59, 59, 999) // set to midnight of the agreement end day
  return Date.now() > endDate
}

module.exports = {
  claimHasExpired
}
