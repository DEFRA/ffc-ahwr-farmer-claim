const Joi = require('joi')
const boom = require('@hapi/boom')
const { beef, dairy } = require('../../constants/species')
const session = require('../../session')
const { vetVisitData: { speciesLastVaccinated, farmerApplication } } = require('../../session/keys')

const monthId = 'month'
const yearId = 'year'

function getBackLink (species) {
  return `/vet/${species}-vaccinated`
}
const date = new Date()
const currentMonth = date.getMonth() + 1
const currentYear = date.getFullYear()

module.exports = [
  {
    method: 'GET',
    path: '/vet/{species}-last-vaccinated',
    options: {
      validate: {
        params: Joi.object({
          species: Joi.string().valid(beef, dairy)
        })
      },
      handler: async (request, h) => {
        const species = request.params.species
        const application = session.getVetVisitData(request, farmerApplication)
        const lastVaccinated = session.getVetVisitData(request, speciesLastVaccinated)
        if (application.data.whichReview !== species) {
          throw boom.badRequest()
        }
        return h.view('vet/species-last-vaccinated', { month: lastVaccinated?.month, year: lastVaccinated?.year, backLink: getBackLink(species) })
      }
    }
  },
  {
    method: 'POST',
    path: '/vet/{species}-last-vaccinated',
    options: {
      validate: {
        payload: Joi.object({
          [monthId]: Joi.number().min(1).when(yearId, {
            is: 2022, then: Joi.number().max(currentMonth), otherwise: Joi.number().max(12)
          }).required(),
          [yearId]: Joi.number().min(2000).max(currentYear).required()
        }),
        params: Joi.object({
          species: Joi.string().valid(beef, dairy)
        }),
        failAction: (request, h, _err) => {
          const species = request.params.species
          const errorMessage = `The date must be after January 2000 and before ${date.toLocaleString('en-gb', { month: 'long', year: 'numeric' })}`
          return h.view('vet/species-last-vaccinated', { ...request.payload, backLink: getBackLink(species), errorMessage }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        const species = request.params.species
        const application = session.getVetVisitData(request, farmerApplication)
        if (application.data.whichReview !== species) {
          throw boom.badRequest()
        }
        const answer = request.payload
        session.setVetVisitData(request, speciesLastVaccinated, answer)
        return h.redirect(`/vet/${species}-vaccination-up-to-date`)
      }
    }
  }
]
