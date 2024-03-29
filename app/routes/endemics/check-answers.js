const routes = require('../../config/routes')
const urlPrefix = require('../../config').urlPrefix
const { livestockTypes, claimType } = require('../../constants/claim')
const { setEndemicsClaim, getEndemicsClaim } = require('../../session')
const { submitNewClaim } = require('../../api-requests/claim-service-api')
const { getSpeciesEligibleNumberForDisplay } = require('../../lib/display-helpers')
const { sheepTestTypes, sheepTestResultsType } = require('../../constants/sheep-test-types')

const pageUrl = `${urlPrefix}/${routes.endemicsCheckAnswers}`

const getBackLink = (typeOfReview, typeOfLivestock) => {
  if (typeOfReview === claimType.review) {
    return typeOfLivestock === livestockTypes.sheep ? `${urlPrefix}/${routes.endemicsTestUrn}` : `${urlPrefix}/${routes.endemicsTestResults}`
  } else {
    return typeOfLivestock === livestockTypes.sheep ? `${urlPrefix}/${routes.endemicsSheepTestResults}` : `${urlPrefix}/${routes.endemicsBiosecurity}`
  }
}

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
        const { organisation, typeOfLivestock, typeOfReview, dateOfVisit, dateOfTesting, speciesNumbers, vetsName, vetRCVSNumber, laboratoryURN } = sessionData
        const backLink = getBackLink(typeOfReview, typeOfLivestock)

        const rows = [
          {
            key: { text: 'Business name' },
            value: { html: capitalize(organisation?.name) }
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
          },
          {
            key: { text: 'Vet Visits Review Test results' }, // Pigs, Dairy, Beef
            value: { html: capitalize(sessionData?.vetVisitsReviewTestResults) },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsVetVisitsReviewTestResults}`, text: 'Change', visuallyHiddenText: 'change vet visits review test results' }] }
          },
          {
            key: { text: 'Diseases status category' }, // Pigs
            value: { html: sessionData?.diseaseStatus },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsDiseaseStatus}`, text: 'Change', visuallyHiddenText: 'change diseases status category' }] }
          },
          {
            key: { text: 'Samples tested' }, // Pigs
            value: { html: sessionData?.numberOfSamplesTested },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsNumberOfSamplesTested}`, text: 'Change', visuallyHiddenText: 'change number of samples tested' }] }
          },
          {
            key: { text: 'Herd vaccination status' }, // Pigs
            value: { html: capitalize(sessionData?.herdVaccinationStatus) },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsVaccination}`, text: 'Change', visuallyHiddenText: 'change herd vaccination status' }] }
          },
          ...(typeOfReview === claimType.endemics && [livestockTypes.pigs, livestockTypes.beef, livestockTypes.dairy].includes(typeOfLivestock)
            ? [{
                key: { text: 'Biosecurity assessment' }, // Pigs - Beef - Dairy
                value: { html: typeOfLivestock === livestockTypes.pigs ? capitalize(`${sessionData?.biosecurity?.biosecurity}, Assessment percentage: ${sessionData?.biosecurity?.assessmentPercentage}%`) : capitalize(sessionData?.biosecurity) },
                actions: { items: [{ href: `${urlPrefix}/${routes.endemicsBiosecurity}`, text: 'Change', visuallyHiddenText: 'change biosecurity assessment' }] }
              }]
            : []),
          ...(typeOfLivestock === livestockTypes.sheep && typeOfReview === claimType.endemics && sessionData?.sheepTestResults?.length
            ? (sessionData?.sheepTestResults || []).map((sheepTest, index) => {
                return {
                  key: { text: index === 0 ? 'Disease test and result' : '' },
                  value: {
                    html: typeof sheepTest.result === 'object'
                      ? sheepTest.result.map(testResult => `${testResult.diseaseType} (${testResult.testResult})</br>`).join(' ')
                      : `${sheepTestTypes[sessionData?.sheepEndemicsPackage].find((test) => test.value === sheepTest.diseaseType).text} (${sheepTestResultsType[sheepTest.diseaseType].find(resultType => resultType.value === sheepTest.result).text})`
                  },
                  actions: { items: [{ href: `${urlPrefix}/${routes.endemicsSheepTestResults}?diseaseType=${sheepTest.diseaseType}`, text: 'Change', visuallyHiddenText: 'change disease type and test result' }] }
                }
              })
            : [])
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
          latestEndemicsApplication,
          vetVisitsReviewTestResults,
          sheepTestResults,
          biosecurity,
          herdVaccinationStatus,
          diseaseStatus,
          sheepEndemicsPackage,
          numberOfSamplesTested
        } = getEndemicsClaim(request)

        const claim = await submitNewClaim({
          applicationReference: latestEndemicsApplication?.reference,
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
            testResults,
            vetVisitsReviewTestResults,
            biosecurity,
            herdVaccinationStatus,
            diseaseStatus,
            sheepEndemicsPackage,
            numberOfSamplesTested,
            ...(typeOfReview === claimType.endemics && typeOfLivestock === livestockTypes.sheep && {
              testResults: sheepTestResults?.map(sheepTest => ({
                diseaseType: sheepTest.diseaseType,
                result: typeof sheepTest.result === 'object' ? sheepTest.result.map(testResult => ({ diseaseType: testResult.diseaseType, result: testResult.testResult })) : sheepTest.result
              }))
            })
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
