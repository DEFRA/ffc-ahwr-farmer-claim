import wreck from '@hapi/wreck'
import appInsights from 'applicationinsights'
import { config } from '../config/index.js'
import { getOrganisationAddress } from './rpa-api/organisation.js'
import { getPersonName } from './rpa-api/person.js'

export async function updateContactHistory (data, logger) {
  const endpoint = `${config.applicationApiUri}/application/contact-history`
  try {
    const { payload } = await wreck.put(endpoint, {
      payload: data,
      json: true
    })

    return payload
  } catch (err) {
    logger.setBindings({ err })
    appInsights.defaultClient.trackException({ exception: err })
    throw err
  }
}

export const changeContactHistory = async (personSummary, organisationSummary, logger) => {
  const currentAddress = getOrganisationAddress(organisationSummary.organisation.address)

  await updateContactHistory({
    farmerName: getPersonName(personSummary),
    orgEmail: organisationSummary.organisation.email,
    email: personSummary.email ? personSummary.email : organisationSummary.organisation.email,
    sbi: organisationSummary.organisation.sbi,
    address: currentAddress,
    user: 'admin'
  }, logger)
}
