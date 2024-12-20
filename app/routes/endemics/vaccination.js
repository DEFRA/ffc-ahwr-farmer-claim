const Joi = require('joi')
const session = require('../../session')
const { urlPrefix } = require('../../config')
const {
  endemicsVaccination,
  endemicsTestUrn,
  endemicsVetRCVS,
  endemicsTestResults
} = require('../../config/routes')
const { endemicsClaim: { herdVaccinationStatus: herdVaccinationStatusKey } } = require('../../session/keys')
const radios = require('../models/form-component/radios')
const { vaccination } = require('../../constants/claim')

const pageUrl = `${urlPrefix}/${endemicsVaccination}`

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { vetVisitsReviewTestResults, herdVaccinationStatus } = session.getEndemicsClaim(request)
      const vaccinatedNotVaccinatedRadios = radios('', 'herdVaccinationStatus')([{ value: vaccination.vaccinated, text: 'Vaccinated', checked: herdVaccinationStatus === 'vaccinated' }, { value: vaccination.notVaccinated, text: 'Not vaccinated', checked: herdVaccinationStatus === 'notVaccinated' }])
      const backLink = vetVisitsReviewTestResults ? `${urlPrefix}/${endemicsTestResults}` : `${urlPrefix}/${endemicsVetRCVS}`
      return h.view(endemicsVaccination, { backLink, ...vaccinatedNotVaccinatedRadios })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        herdVaccinationStatus: Joi.string().valid(vaccination.vaccinated, vaccination.notVaccinated).required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        const { vetVisitsReviewTestResults } = session.getEndemicsClaim(request)
        const vaccinatedNotVaccinatedRadios = radios('', 'herdVaccinationStatus', 'Select a vaccination status')([{ value: vaccination.vaccinated, text: 'Vaccinated' }, { value: vaccination.notVaccinated, text: 'Not vaccinated' }])
        const backLink = vetVisitsReviewTestResults ? `${urlPrefix}/${endemicsTestResults}` : `${urlPrefix}/${endemicsVetRCVS}`
        return h.view(endemicsVaccination, {
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
      return h.redirect(`${urlPrefix}/${endemicsTestUrn}`)
    }
  }
}

module.exports = { handlers: [getHandler, postHandler] }
