const config = require('../config')

function claimHasExpired (application) {
  const startDate = new Date(application.createdAt)
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + config.claimExpiryTimeMonths)
  endDate.setHours(24, 0, 0, 0) // set to midnight of agreement end day
  console.log(`Checking if agreement with reference ${application.reference}, start date of ${startDate} and end date of ${endDate} has exceeded claim deadline of ${config.claimExpiryTimeMonths} months.`)
  return Date.now() > endDate
}

module.exports = {
  claimHasExpired
}
