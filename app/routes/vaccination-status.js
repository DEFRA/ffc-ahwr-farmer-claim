const Joi = require('joi')
const boom = require('@hapi/boom')
const { getSpecies, setSpecies, getApplication } = require('../session')
const { whichReview } = require('../session/keys').farmerApplyData
const { vaccinated, lastVaccinated, vaccinationUpToDate } = require('../session/keys').speciesData
const { speciesVaccinatedRadios } = require('./models/form-component/species-vaccinated-radios')
const speciesContent = require('../constants/species-vaccinated-content-vet')
const { fully, partly, no, na } = require('../constants/vaccinated-options')
const backLink = '/visit-review'
module.exports = [{
  method: 'GET',
  path: `/vaccination-status`,
  options: {
    handler: async (request, h) => {
      const species = getApplication(request, whichReview)
      console.log(species, 'Selected Species')
        if (!species) {
          throw boom.badRequest()
        }
        const title = speciesContent[species].title
        setSpecies(request, vaccinated, null)
        setSpecies(request, lastVaccinated, null)
        setSpecies(request, vaccinationUpToDate, null)
        return h.view(`species-vaccinated`, {
          ...speciesVaccinatedRadios(speciesContent[species].title, vaccinated, setSpecies(request, vaccinated)),
          backLink,
          title
        })
    }
  }
},
{
  method: 'POST',
  path: '/vaccination-status',
  options: {
    validate: {
      payload: Joi.object({
        [vaccinated]: Joi.string().valid(fully.value, partly.value, no.value, na.value).required()
      }),
      failAction: (request, h, _err) => {
        const title = speciesContent[species].title
        return h.view(`species-vaccinated`, {
          ...speciesVaccinatedRadios(speciesContent[species].title, vaccinated, setSpecies(request, vaccinated), speciesContent[species].errorText),
          backLink,
          title
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const answer = request.payload[vaccinated]
      setSpecies(request, vaccinated, answer)
      if (answer === no.value || answer === na.value) {
        return h.redirect(`/species-test`)
      }
      return h.redirect(`/species-last-vaccinated`)
    }
  }
}]
