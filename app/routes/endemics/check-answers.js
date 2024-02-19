const routes = require('../../config/routes')
const urlPrefix = require('../../config').urlPrefix
const { livestockTypes, claimType } = require('../../constants/claim')
const { setEndemicsClaim, getEndemicsClaim } = require('../../session')
const { submitNewClaim } = require('../../api-requests/claim-service-api')
const { getSpeciesEligibleNumberForDisplay } = require('../../lib/display-helpers')

const pageUrl = `${urlPrefix}/${routes.endemicsCheckAnswers}`

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
            value: { html: organisation.name }
          },
          {
            key: { text: 'Livestock' },
            value: { html: typeOfLivestock }
          },
          {
            key: { text: 'Type of review' },
            value: { html: typeOfReview === claimType.review ? 'Annual health and welfare review' : 'Endemic disease follow-ups' }
          },
          {
            key: { text: 'Date of visit' },
            value: { html: (new Date(dateOfVisit)).toLocaleDateString('en-GB') },
            actions: { items: [{ href: routes.endemicsTestUrn, text: 'Change', visuallyHiddenText: 'change date of visit' }] }
          },
          {
            key: { text: 'Date of testing' },
            value: { html: (new Date(dateOfTesting)).toLocaleDateString('en-GB') },
            actions: { items: [{ href: routes.endemicsDateOfTesting, text: 'Change', visuallyHiddenText: 'change date of testing' }] }
          },
          {
            key: { text: getSpeciesEligibleNumberForDisplay(sessionData, true) },
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
          minimumNumberAnimalsRequired,
          testResults,
          latestEndemicsApplication
        } = getEndemicsClaim(request)

        const claim = await submitNewClaim({
          applicationReference: latestEndemicsApplication.reference,
          type: claimType[typeOfReview],
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
            minimumNumberAnimalsRequired,
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
