const Joi = require('joi')
const session = require('../../session')
const urlPrefix = require('../../config').urlPrefix
const {
  endemicsHerdVaccinationStatus,
  endemicsTestReference,
  endemicsVetRCVS,
  endemicsTestResults
} = require('../../config/routes')
const { endemicsClaim: { herdVaccinationStatus: herdVaccinationStatusKey } } = require('../../session/keys')
const radios = require('../models/form-component/radios')

const pageUrl = `${urlPrefix}/${endemicsHerdVaccinationStatus}`

module.exports = [{
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { latestVetVisitApplication, herdVaccinationStatus } = session.getEndemicsClaim(request)
      const vaccinatedNotVaccinatedRadios = radios('', 'herdVaccinationStatus')([{ value: 'vaccinated', text: 'Vaccinated', checked: herdVaccinationStatus === 'vaccinated' }, { value: 'notVaccinated', text: 'Not vaccinated', checked: herdVaccinationStatus === 'notVaccinated' }])
      const backLink = latestVetVisitApplication === 'EE' ? `${urlPrefix}/${endemicsTestResults}` : `${urlPrefix}/${endemicsVetRCVS}`
      return h.view(endemicsHerdVaccinationStatus, { backLink, ...vaccinatedNotVaccinatedRadios })
    }
  }
}, {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        herdVaccinationStatus: Joi.string().valid('vaccinated', 'notVaccinated').required()
      }),
      failAction: async (request, h, error) => {
        const { latestVetVisitApplication } = session.getEndemicsClaim(request)
        const vaccinatedNotVaccinatedRadios = radios('', 'herdVaccinationStatus', 'Select a vaccination status')([{ value: 'vaccinated', text: 'Vaccinated' }, { value: 'notVaccinated', text: 'Not vaccinated' }])
        const backLink = latestVetVisitApplication === 'EE' ? `${urlPrefix}/${endemicsTestResults}` : `${urlPrefix}/${endemicsVetRCVS}`
        return h.view(endemicsHerdVaccinationStatus, {
          ...request.payload,
          backLink,
          ...vaccinatedNotVaccinatedRadios,
          errorMessage: {
            text: 'Select a vaccination status',
            href: '#herdVaccinationStatus'
          }
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { herdVaccinationStatus } = request.payload

      session.setEndemicsClaim(request, herdVaccinationStatusKey, herdVaccinationStatus)
      return h.redirect(`${urlPrefix}/${endemicsTestReference}`)
    }
  }
}]
