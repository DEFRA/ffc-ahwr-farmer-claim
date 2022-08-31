const { v4: uuid } = require('uuid')
const { testToken } = require('../../config')
const { getByEmail } = require('../../api-requests/users')

module.exports = async function getToken (email) {
  if (testToken) {
    const user = await getByEmail(email)
    if (user.isTest) {
      return testToken
    }
  }
  return uuid()
}
