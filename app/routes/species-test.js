const Joi = require('joi')
const boom = require('@hapi/boom')
const { getYesNoRadios } = require('../helpers/yes-no-radios')
const speciesTypes = require('../../constants/species')
const speciesContent = require('../../constants/species-test-content-vet')
const { fully, partly } = require('../../constants/vaccinated-options')
const session = require('../../session')
const { vetVisitData: { farmerApplication, speciesTest, speciesVaccinated } } = require('../../session/keys')

function getBackLink (request) {
  const species = request.params.species
  const vaccinated = session.getVetVisitData(request, speciesVaccinated)
  if (species === speciesTypes.beef || species === speciesTypes.dairy) {
    if (vaccinated === fully.value || vaccinated === partly.value) {
      return `/vet/${species}-vaccination-up-to-date`
    } else {
      return `/vet/${species}-vaccinated`
    }
  }
  return `/vet/${species}-eligibility`
}
module.exports = [
  {
    method: 'GET',
    path: '/vet/{species}-test',
    options: {
      validate: {
        params: Joi.object({
          species: Joi.string().valid(speciesTypes.beef, speciesTypes.dairy, speciesTypes.pigs)
        })
      },
      handler: async (request, h) => {
        const species = request.params.species
        const application = session.getVetVisitData(request, farmerApplication)
        if (application.data.whichReview !== species) {
          throw boom.badRequest()
        }
        return h.view('vet/species-test', {
          ...getYesNoRadios(speciesContent[species].legendText, speciesTest, session.getVetVisitData(request, speciesTest), null, { inline: true }),
          backLink: getBackLink(request),
          title: speciesContent[species].title
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/vet/{species}-test',
    options: {
      validate: {
        payload: Joi.object({
          [speciesTest]: Joi.string().valid('yes', 'no').required()
        }),
        params: Joi.object({
          species: Joi.string().valid(speciesTypes.beef, speciesTypes.dairy, speciesTypes.pigs)
        }),
        failAction: (request, h, _err) => {
          const species = request.params.species
          const title = speciesContent[species].title
          return h.view('vet/species-test', {
            ...getYesNoRadios(speciesContent[species].legendText, speciesTest, session.getVetVisitData(request, speciesTest), speciesContent[species].errorText, { inline: true }),
            backLink: getBackLink(request),
            title
          }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        const species = request.params.species
        const application = session.getVetVisitData(request, farmerApplication)
        if (application.data.whichReview !== species) {
          throw boom.badRequest()
        }
        session.setVetVisitData(request, speciesTest, request.payload[speciesTest])
        if (species === speciesTypes.beef || species === speciesTypes.dairy) {
          return h.redirect(`/vet/${species}-bvd-in-herd`)
        }
        return h.redirect('/vet/review-report')
      }
    }
  }
]
