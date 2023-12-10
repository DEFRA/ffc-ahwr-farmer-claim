const Joi = require('joi')
const { eligibleSpecies } = require('../session/keys').claim
const { getYesNoRadios } = require('./models/form-component/yes-no-radios')
const session = require('../session')
const speciesTypes = require('../constants/species')
const speciesContent = require('../constants/species-content')
const urlPrefix = require('../config/index').urlPrefix

const backLink = `${urlPrefix}/which-review`

const getRadioOptions = (species) => {
  return { isPageHeading: true, legendClasses: 'govuk-fieldset__legend--l', inline: true, hintText: speciesContent[species].hintText }
}

module.exports = [
  {
    method: 'GET',
    path: `${urlPrefix}/{species}-eligibility`,
    options: {
      validate: {
        params: Joi.object({
          species: Joi.string().valid(speciesTypes.beef, speciesTypes.dairy, speciesTypes.pigs, speciesTypes.sheep)
        })
      },
      handler: async (request, h) => {
        const species = request.params.species
        const title = speciesContent[species].title
        return h.view('eligibility/species-eligibility', {
          ...getYesNoRadios(speciesContent[species].legendText, eligibleSpecies, session.getFarmerApplyData(request, eligibleSpecies), undefined, getRadioOptions(species)),
          backLink,
          title
        })
      }
    }
  },
  {
    method: 'POST',
    path: `${urlPrefix}/{species}-eligibility`,
    options: {
      validate: {
        payload: Joi.object({
          [eligibleSpecies]: Joi.string().valid('yes', 'no').required()
        }),
        params: Joi.object({
          species: Joi.string().valid(speciesTypes.beef, speciesTypes.dairy, speciesTypes.pigs, speciesTypes.sheep)
        }),
        failAction: (request, h, _err) => {
          const species = request.params.species
          const title = speciesContent[species].title
          return h.view('eligibility/species-eligibility', {
            ...getYesNoRadios(speciesContent[species].legendText, eligibleSpecies, session.getFarmerApplyData(request, eligibleSpecies), speciesContent[species].errorText, getRadioOptions(species)),
            backLink,
            title
          }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        session.setFarmerApplyData(request, eligibleSpecies, request.payload[eligibleSpecies])
        const redirect = request.payload[eligibleSpecies] === 'yes' ? 'check-answers' : 'not-eligible'
        return h.redirect(`${urlPrefix}/${redirect}`)
      }
    }
  }]
