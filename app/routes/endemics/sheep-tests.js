const Joi = require('joi')
const session = require('../../session')
const { urlPrefix } = require('../../config')
const { endemicsSheepEndemicsPackage, endemicsSheepTests } = require('../../config/routes')
const { sheepTestTypes } = require('../../constants/sheep-test-types')

const pageUrl = `${urlPrefix}/${endemicsSheepTests}`
const backLink = `${urlPrefix}/${endemicsSheepEndemicsPackage}`

module.exports = [{
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const { sheepEndemicsPackage } = session.getEndemicsClaim(request)
      const checkItems = sheepTestTypes[sheepEndemicsPackage]
      const sheepTestCheckboxItems = checkItems

      return h.view(endemicsSheepTests, {
        sheepTestCheckboxItems,
        backLink
      })
    }
  }
}, {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        sheepTests: Joi.array().items(
          Joi.string().valid('johnes'),
          Joi.string().valid('mv'),
        ),
      }),
      failAction: async (request, h, error) => {
        const { sheepEndemicsPackage } = session.getEndemicsClaim(request)
        const checkItems = sheepTestTypes[sheepEndemicsPackage]
        const sheepTestCheckboxItems = checkItems
        return h.view(endemicsSheepTests, {
          ...request.payload,
          sheepTestCheckboxItems,
          backLink,
          errorMessage: {
            text: 'Select at least one test',
            href: '#sheepTests'
          }
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { sheepTests } = request.payload
      session.setEndemicsClaim(request, sheepTestsKey, sheepTests)
      // TODO: Make this dynamic to test results instead of backwards
      return h.redirect(`${urlPrefix}/${endemicsSheepEndemicsPackage}`)
    }
  }
}]
