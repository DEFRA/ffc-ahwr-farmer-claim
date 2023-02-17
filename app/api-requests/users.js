const { getEligibleUserByEmail } = require('./eligibility-service')

async function getByEmail (email) {
  return await getEligibleUserByEmail(email)
}

module.exports = {
  getByEmail
}
