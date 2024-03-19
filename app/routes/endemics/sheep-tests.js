const { urlPrefix } = require('../../config')
const { sheepTestTypes } = require('../../constants/sheep-test-types')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { endemicsSheepEndemicsPackage, endemicsSheepTests, endemicsSheepTestResults } = require('../../config/routes')

const pageUrl = `${urlPrefix}/${endemicsSheepTests}`
const backLink = `${urlPrefix}/${endemicsSheepEndemicsPackage}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const session = getEndemicsClaim(request)
        const sheepTestCheckboxItems = sheepTestTypes[session?.sheepEndemicsPackage].map((test) => ({ ...test, checked: session.sheepTests?.includes(test.value) }))

        return h.view(endemicsSheepTests, {
          sheepTestCheckboxItems,
          backLink
        })
      }
    }
  },
  {
    method: 'POST',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const { sheepTests } = request.payload
        const session = getEndemicsClaim(request)

        if (!sheepTests) {
          const sheepTestCheckboxItems = sheepTestTypes[session?.sheepEndemicsPackage].map((test) => ({ ...test, checked: session.sheepTests?.includes(test.value) }))

          return h.view(endemicsSheepTests, {
            sheepTestCheckboxItems,
            backLink,
            errorMessage: {
              text: 'Select at least one test',
              href: '#sheepTests'
            }
          }).code(400).takeover()
        }

        setEndemicsClaim(request, 'sheepTests', sheepTests)
        setEndemicsClaim(request, 'sheepTestResults',
          [...(typeof sheepTests === 'object' ? sheepTests : [sheepTests])]
            .map((test, index) => ({ diseaseType: test, result: session?.sheepTestResults?.find(item => item.diseaseType === test)?.result || '', isCurrentPage: index === 0 })))

        return h.redirect(`${urlPrefix}/${endemicsSheepTestResults}`)
      }
    }
  }
]
