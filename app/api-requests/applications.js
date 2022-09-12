const Wreck = require('@hapi/wreck')
const { applicationApiUri } = require('../config')
async function getApplication (reference) {
  const url = `${applicationApiUri}/application/get/${reference}`
  try {
    const response = await Wreck.get(url, { json: true })
    if (response.res.statusCode !== 200) {
      return null
    }
    return response.payload
  } catch (err) {
    console.log(err)
    return null
  }
}
module.exports = {
  getApplication
}
