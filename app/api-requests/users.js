const downloadBlob = require('../lib/storage/download-blob')
const { usersContainer, usersFile } = require('../config').storageConfig
const { eligibilityApiEnabled } = require ('../config')
const { getEligibleUserByEmail } = require('./eligibility-service')

async function getUsers () {
  const contents = await downloadBlob(usersContainer, usersFile) ?? '[]'
  return JSON.parse(contents)
}

async function getByEmail (email) {
  if (eligibilityApiEnabled) {
    return await getEligibleUserByEmail(email)
  }
  return (await getUsers()).find(x => x.email.toLowerCase() === email.toLowerCase())
}

module.exports = {
  getByEmail
}
