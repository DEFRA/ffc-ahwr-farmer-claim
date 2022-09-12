const Joi = require('joi')
const boom = require('@hapi/boom')
const { speciesVaccinationUpToDateRadios } = require('../models/form-component/species-vaccination-up-to-date-radios')
const { yes, no, na } = require('../../constants/vaccination-up-to-date-options')
const { vaccinationUpToDate } = require('../session/keys').speciesData
const { getApplication, getSpecies } = require('../session')
const { whichReview } = require('../session/keys').farmerApplyData

const title = 'Were all breeding cattle up to date with vaccination?'
const errorText = 'Select yes if breeding cattle were vaccinated'
const backLink = `/species-last-vaccinated`
module.exports = [
  {
    method: 'GET',
    path: 'species-vaccination-up-to-date',
    options: {
      handler: async (request, h) => {
        const species = getApplication(request, whichReview)
        if (!species) {
          throw boom.badRequest()
        }
        return h.view('species-vaccination-up-to-date', {
          ...speciesVaccinationUpToDateRadios(title, vaccinationUpToDate, getSpecies(request, vaccinationUpToDate)),
          backLink,
          title
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/species-vaccination-up-to-date',
    options: {
      validate: {
        payload: Joi.object({
          [speciesVaccinationUpToDate]: Joi.string().valid(yes.value, no.value, na.value).required()
        }),
        failAction: (request, h, _err) => {
          const species = getApplication(request, whichReview)
          return h.view('species-vaccination-up-to-date', {
            ...speciesVaccinationUpToDateRadios(title, vaccinationUpToDate, getSpecies(request, vaccinationUpToDate), errorText),
            backLink,
            title
          }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        const species = getApplication(request, whichReview)
        if (!species) {
          throw boom.badRequest()
        }
        const answer = request.payload[vaccinationUpToDate]
        session.setVetVisitData(request, vaccinationUpToDate, answer)
        return h.redirect(`/species-test`)
      }
    }
  }
]
