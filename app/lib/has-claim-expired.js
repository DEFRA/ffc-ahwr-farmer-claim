
const config = require('../../app/config')

function hasClaimExpired (application) {
  const startDate = new Date(application.createdAt)
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + config.claimExpiryTimeMonths)
  console.log(`Checking if agreement with reference ${application.reference}, start date of ${startDate} and end date of ${endDate} has exceeded claim deadline of ${config.claimExpiryTimeMonths} months.`)
  return Date.now() > endDate
}

module.exports = {
  hasClaimExpired
}
