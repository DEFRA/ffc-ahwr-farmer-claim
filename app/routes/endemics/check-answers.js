const routes = require('../../config/routes')
const urlPrefix = require('../../config').urlPrefix
const { livestockTypes, claimType } = require('../../constants/claim')
const { setEndemicsClaim, getEndemicsClaim } = require('../../session')
const { submitNewClaim } = require('../../api-requests/claim-service-api')
const { getSpeciesEligibleNumberForDisplay } = require('../../lib/display-helpers')

const pageUrl = `${urlPrefix}/${routes.endemicsCheckAnswers}`

const formatDate = (date) => (new Date(date)).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
const capitalize = (value) => {
  if (value) return value.charAt(0).toUpperCase() + value.slice(1)
}

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const sessionData = getEndemicsClaim(request)
        const {
          organisation, typeOfLivestock, typeOfReview, dateOfVisit, dateOfTesting, speciesNumbers, vetsName,
          vetRCVSNumber, laboratoryURN
        } = sessionData
        const backLink = typeOfLivestock === livestockTypes.sheep ? `${urlPrefix}/${routes.endemicsTestUrn}` : `${urlPrefix}/${routes.endemicsTestResults}`

        const rows = [
          {
            key: { text: 'Business name' },
            value: { html: capitalize(organisation.name) }
          },
          {
            key: { text: 'Livestock' },
            value: { html: capitalize([livestockTypes.pigs, livestockTypes.sheep].includes(typeOfLivestock) ? typeOfLivestock : `${typeOfLivestock} cattle`) }
          },
          {
            key: { text: 'Type of review' },
            value: { html: typeOfReview === claimType.review ? 'Annual health and welfare review' : 'Endemic disease follow-ups' }
          },
          {
            key: { text: 'Date of visit' },
            value: { html: formatDate(dateOfVisit) },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsDateOfVisit}`, text: 'Change', visuallyHiddenText: 'change date of visit' }] }
          },
          {
            key: { text: 'Date of testing' },
            value: { html: formatDate(dateOfTesting) },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsDateOfTesting}`, text: 'Change', visuallyHiddenText: 'change date of testing' }] }
          },
          {
            key: { text: getSpeciesEligibleNumberForDisplay(sessionData, true) },
            value: { html: capitalize(speciesNumbers) },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsSpeciesNumbers}`, text: 'Change', visuallyHiddenText: 'change number of species' }] }
          },
          {
            key: { text: 'Vet\'s name' },
            value: { html: capitalize(vetsName) },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsVetName}`, text: 'Change', visuallyHiddenText: 'change vet\'s name' }] }
          },
          {
            key: { text: 'Vet\'s RCVS number' },
            value: { html: vetRCVSNumber },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsVetRCVS}`, text: 'Change', visuallyHiddenText: 'change vet\'s rcvs number' }] }
          },
          {
            key: { text: 'Test results URN' },
            value: { html: laboratoryURN },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsTestUrn}`, text: 'Change', visuallyHiddenText: 'change test URN' }] }
          },
          {
            key: { text: 'Number of tests' }, // Pigs
            value: { html: sessionData?.numberOfOralFluidSamples },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsNumberOfOralFluidSamples}`, text: 'Change', visuallyHiddenText: 'change number of oral fluid samples' }] }
          },
          {
            key: { text: 'Number of animals tested' }, // Pigs, Beef, Sheep
            value: { html: sessionData?.numberAnimalsTested },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsNumberOfSpeciesTested}`, text: 'Change', visuallyHiddenText: 'change number of animals tested' }] }
          },
          {
            key: { text: 'Test results' }, // Pigs, Dairy, Beef
            value: { html: capitalize(sessionData?.testResults) },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsTestResults}`, text: 'Change', visuallyHiddenText: 'change test results' }] }
          }
        ]

        const rowsWithData = rows.filter((row) => row.value.html !== undefined)

        return h.view(routes.endemicsCheckAnswers, { listData: { rows: rowsWithData }, backLink })
      }
    }
  },
  {
    method: 'POST',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const {
          typeOfLivestock,
          typeOfReview,
          dateOfVisit,
          dateOfTesting,
          speciesNumbers,
          vetsName,
          vetRCVSNumber,
          laboratoryURN,
          numberOfOralFluidSamples,
          numberAnimalsTested,
          testResults,
          latestEndemicsApplication
        } = getEndemicsClaim(request)

        const claim = await submitNewClaim({
          applicationReference: latestEndemicsApplication.reference,
          type: typeOfReview,
          createdBy: 'admin',
          data: {
            typeOfLivestock,
            dateOfVisit,
            dateOfTesting,
            speciesNumbers,
            vetsName,
            vetRCVSNumber,
            laboratoryURN,
            numberOfOralFluidSamples,
            numberAnimalsTested,
            testResults
          }
        })

        setEndemicsClaim(request, 'reference', claim.reference)

        return h.redirect(
          `${urlPrefix}/${routes.endemicsConfirmation}`
        )
      }
    }
  }
]
