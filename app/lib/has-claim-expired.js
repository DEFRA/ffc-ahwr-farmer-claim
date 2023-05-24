
const config = require('../../app/config')

function hasClaimExpired (application) {
  console.log(`Checking if agreement with reference ${application.reference} and start date of ${application.createdAt} has exceeded claim deadline of ${config.claimExpiryTimeMonths} months.`)
  let endDate = new Date(application.createdAt)
  endDate = new Date(endDate.setMonth(endDate.getMonth() + config.claimExpiryTimeMonths))
  const currentDate = new Date()
  return currentDate > endDate
}
  
module.exports = {
  hasClaimExpired
}
