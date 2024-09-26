const Joi = require('joi')
const session = require('../../session')
const { endemicsClaim } = require('../../session/keys')
const {
  endemicsSheepName,
  endemicsNumberOfSpeciesTested,
  endemicsVetName
} = require('../../config/routes')
const errorMessages = require('../../../app/lib/error-messages')
const urlPrefix = require('../../config').urlPrefix

const path = `${urlPrefix}/endemics/sheep-name`

module.exports = [{
  method: 'get',
  path,
  options: {
    handler: (request, h) => {
      const { sheepName } = session.getEndemicsClaim(request)
      return h.view(endemicsSheepName, {
        sheepName,
        backLink: `${urlPrefix}/${endemicsNumberOfSpeciesTested}`
      })
    }
  }
}, {
  method: 'post',
  path,
  options: {
    validate: {
      payload: Joi.object({
        sheepName: Joi.string()
          .required()
          .messages({
            'any.required': errorMessages.sheepName
          })
      }),
      failAction: async (request, h, error) => {
        return h.view(endemicsSheepName, { ...request.payload, errorMessage: { text: error.details[0].message } }).code(400).takeover()
      }
    },
    handler: (request, h) => {
      const { sheepName } = request.payload

      session.setEndemicsClaim(request, endemicsClaim.sheepName, sheepName)
      return h.redirect(`${urlPrefix}/${endemicsVetName}`)
    }
  }
}]
