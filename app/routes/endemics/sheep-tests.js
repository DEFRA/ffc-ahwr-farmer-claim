const { urlPrefix } = require('../../config')
const { sheepTestTypes } = require('../../constants/sheep-test-types')
const { getEndemicsClaim, setEndemicsClaim } = require('../../session')
const { sheepTests: sheepTestsKey, sheepTestResults: sheepTestResultsKey } = require('../../session/keys').endemicsClaim
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
        setEndemicsClaim(request, sheepTestsKey, sheepTests)

        if (!sheepTests) {
          setEndemicsClaim(request, sheepTestResultsKey, undefined)
          const sheepTestCheckboxItems = sheepTestTypes[session?.sheepEndemicsPackage].map((test) => ({ ...test, checked: session.sheepTests?.includes(test.value) }))

          return h.view(endemicsSheepTests, {
            sheepTestCheckboxItems,
            backLink,
            errorMessage: {
              text: 'You must select a disease',
              href: '#sheepTests'
            }
          }).code(400).takeover()
        }

        setEndemicsClaim(request, sheepTestResultsKey,
          [...(typeof sheepTests === 'object' ? sheepTests : [sheepTests])]
            .map((test, index) => ({ diseaseType: test, result: session?.sheepTestResults?.find(item => item.diseaseType === test)?.result || '', isCurrentPage: index === 0 })))
        return h.redirect(`${urlPrefix}/${endemicsSheepTestResults}`)
      }
    }
  }
]
