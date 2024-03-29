const Joi = require('joi')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { urlPrefix } = require('../../config')
const radios = require('../models/form-component/radios')
const { endemicsSheepEndemicsPackage, endemicsVetRCVS, endemicsSheepTests } = require('../../config/routes')
const { endemicsClaim: { sheepEndemicsPackage: sheepEndemicsPackageKey } } = require('../../session/keys')
const pageUrl = `${urlPrefix}/${endemicsSheepEndemicsPackage}`

module.exports = [{
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const session = getEndemicsClaim(request)
      const sheepEndemicsPackageRadios = radios('', 'sheepEndemicsPackage')([
        { value: 'improvedEwePerformance', text: 'Improved ewe performance', checked: session?.sheepEndemicsPackage === 'improvedEwePerformance' },
        { value: 'improvedReproductivePerformance', text: 'Improved reproductive performance', checked: session?.sheepEndemicsPackage === 'improvedReproductivePerformance' },
        { value: 'improvedLambPerformance', text: 'Improved lamb performance', checked: session?.sheepEndemicsPackage === 'improvedLambPerformance' },
        { value: 'improvedNeonatalLambSurvival', text: 'Improved neonatal lamb survival', checked: session?.sheepEndemicsPackage === 'improvedNeonatalLambSurvival' },
        { value: 'reducedExternalParasites', text: 'Reduced level of external parasites', checked: session?.sheepEndemicsPackage === 'reducedExternalParasites' },
        { value: 'reducedLameness', text: 'Reduced level of lameness', checked: session?.sheepEndemicsPackage === 'reducedLameness' }
      ])
      const backLink = `${urlPrefix}/${endemicsVetRCVS}`
      return h.view(endemicsSheepEndemicsPackage, { backLink, sheepEndemicsPackage: session?.sheepEndemicsPackage, ...sheepEndemicsPackageRadios })
    }
  }
}, {
  method: 'POST',
  path: pageUrl,
  options: {
    validate: {
      payload: Joi.object({
        sheepEndemicsPackage: Joi.string().valid(
          'improvedEwePerformance',
          'improvedReproductivePerformance',
          'improvedLambPerformance',
          'improvedNeonatalLambSurvival',
          'reducedExternalParasites',
          'reducedLameness').required()
      }),
      failAction: async (request, h, error) => {
        const sheepEndemicsPackageRadios = radios('', 'sheepEndemicsPackage', 'Select a package')([
          { value: 'improvedEwePerformance', text: 'Improved ewe performance' },
          { value: 'improvedReproductivePerformance', text: 'Improved reproductive performance' },
          { value: 'improvedLambPerformance', text: 'Improved lamb performance' },
          { value: 'improvedNeonatalLambSurvival', text: 'Improved neonatal lamb survival' },
          { value: 'reducedExternalParasites', text: 'Reduced level of external parasites' },
          { value: 'reducedLameness', text: 'Reduced level of lameness' }])
        const backLink = `${urlPrefix}/${endemicsVetRCVS}`
        return h.view(endemicsSheepEndemicsPackage, {
          ...request.payload,
          backLink,
          ...sheepEndemicsPackageRadios,
          errorMessage: {
            text: 'Select a package',
            href: '#sheepEndemicsPackage'
          }
        }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { sheepEndemicsPackage } = request.payload
      const session = getEndemicsClaim(request)

      if (session?.sheepEndemicsPackage !== sheepEndemicsPackage) {
        setEndemicsClaim(request, 'sheepTests', undefined)
        setEndemicsClaim(request, 'sheepTestResults', undefined)
      }

      setEndemicsClaim(request, sheepEndemicsPackageKey, sheepEndemicsPackage)

      return h.redirect(`${urlPrefix}/${endemicsSheepTests}`)
    }
  }
}]
