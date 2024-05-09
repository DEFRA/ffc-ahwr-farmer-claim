const Wreck = require('@hapi/wreck')
const appInsights = require('applicationinsights')
const config = require('../config')
const { getOrganisationAddress, getPersonName } = require('./rpa-api/index')

async function updateContactHistory (data) {
  try {
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
    console.error(`${new Date().toISOString()} updating contact history`)
    appInsights.defaultClient.trackException({ exception: error })
    return null
  }
}

const changeContactHistory = async (personSummary, organisationSummary, reference) => {
  const currentAddress = getOrganisationAddress(organisationSummary.organisation.address)

  await updateContactHistory({
    farmerName: getPersonName(personSummary),
    orgEmail: organisationSummary.organisation.email,
    email: personSummary.email ? personSummary.email : organisationSummary.organisation.email,
    sbi: organisationSummary.organisation.sbi,
    address: currentAddress,
    user: 'admin'
  })
}

module.exports = {
  changeContactHistory,
  updateContactHistory
}
