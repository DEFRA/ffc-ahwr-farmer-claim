const Wreck = require('@hapi/wreck')
const appInsights = require('applicationinsights')
const config = require('../config')
const { getOrganisationAddress } = require('./rpa-api/index')

async function updateContactHistory (data) {
  try {
    console.log('%%%%%%%%%%%%%%%updateContactHistory', `${config.applicationApiUri}/application/contact-history`)
    const response = await Wreck.put(`${config.applicationApiUri}/application/contact-history`, {
      payload: data,
      json: true
    })
    if (response.res.statusCode !== 200) {
      appInsights.defaultClient.trackException({ exception: response.res.statusMessage })
      throw new Error(
        `HTTP ${response.res.statusCode} (${response.res.statusMessage})`
      )
    }
    return response.payload
  } catch (error) {
    console.error(`${new Date().toISOString()} claim submission failed`)
    appInsights.defaultClient.trackException({ exception: error })
    return null
  }
}

const changeContactHistory = async (personSummary, organisationSummary, reference) => {
  console.log('%%%%%%%%%%%%%%personSummary', personSummary)
  const currentAddress = getOrganisationAddress(organisationSummary.organisation.address)

  await updateContactHistory({
    email: personSummary.email,
    sbi: organisationSummary.organisation.sbi,
    address: currentAddress,
    user: 'admin'
  })
}

module.exports = {
  changeContactHistory,
  updateContactHistory
}
