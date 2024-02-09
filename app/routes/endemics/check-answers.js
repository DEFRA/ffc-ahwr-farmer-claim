const session = require('../../session')
const routes = require('../../config/routes')
const urlPrefix = require('../../config').urlPrefix
const { livestockTypes } = require('../../constants/claim')
const { getSpeciesEligbileNumberForDisplay } = require('../../lib/display-helpers')

const pageUrl = `${urlPrefix}/${routes.endemicsCheckAnswers}`

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const sessionData = session.getEndemicsClaim(request)
        const {
          organisation, typeOfLivestock, typeOfReview, dateOfVisit, dateOfTesting, speciesNumbers, vetsName,
          vetRCVSNumber, laboratoryURN
        } = sessionData

        const backLink = typeOfLivestock === livestockTypes.sheep ? routes.endemicsTestUrn : routes.endemicsTestResults

        const rows = [
          {
            key: { text: 'Business name' },
            value: { html: organisation.name }
          },
          {
            key: { text: 'Livestock' },
            value: { html: typeOfLivestock }
          },
          {
            key: { text: 'Type of review' },
            value: { html: typeOfReview }
          },
          {
            key: { text: 'Date of visit' },
            value: { html: dateOfVisit },
            actions: { items: [{ href: routes.endemicsTestUrn, text: 'Change', visuallyHiddenText: 'change date of visit' }] }
          },
          {
            key: { text: 'Date of testing' },
            value: { html: dateOfTesting },
            actions: { items: [{ href: routes.endemicsDateOfTesting, text: 'Change', visuallyHiddenText: 'change date of testing' }] }
          },
          {
            key: { text: getSpeciesEligbileNumberForDisplay(sessionData, true) },
            value: { html: speciesNumbers },
            actions: { items: [{ href: routes.endemicsSpeciesNumbers, text: 'Change', visuallyHiddenText: 'change URN' }] }
          },
          {
            key: { text: 'Vet\'s name' },
            value: { html: vetsName },
            actions: { items: [{ href: routes.endemicsVetName, text: 'Change', visuallyHiddenText: 'change vet\'s name' }] }
          },
          {
            key: { text: 'Vet\'s RCVS number' },
            value: { html: vetRCVSNumber },
            actions: { items: [{ href: routes.endemicsTestUrn, text: 'Change', visuallyHiddenText: 'change vet\'s rcvs number' }] }
          },
          {
            key: { text: 'Test results URN' },
            value: { html: laboratoryURN },
            actions: { items: [{ href: routes.endemicsTestUrn, text: 'Change', visuallyHiddenText: 'change test URN' }] }
          },
          {
            key: { text: 'Number of tests' }, // Pigs
            value: { html: sessionData?.numberOfOralFluidSamples },
            actions: { items: [{ href: routes.endemicsNumberOfOralFluidSamples, text: 'Change', visuallyHiddenText: 'change number of oral fluid samples' }] }
          },
          {
            key: { text: 'Number of animals tested' }, // Pigs, Beef, Sheep
            value: { html: sessionData?.numberAnimalsTested },
            actions: { items: [{ href: routes.endemicsNumberOfSpeciesTested, text: 'Change', visuallyHiddenText: 'change number of animals tested' }] }
          },
          {
            key: { text: 'Test results' }, // Pigs, Dairy, Beef
            value: { html: sessionData?.testResults },
            actions: { items: [{ href: routes.endemicsTestResults, text: 'Change', visuallyHiddenText: 'change test results' }] }
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
      handler: async (_request, h) => {
        // Submit claim

        return h.redirect(`${urlPrefix}/${routes.endemicsConfirmation}`)
      }
    }
  }
]
