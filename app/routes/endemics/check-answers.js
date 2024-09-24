const routes = require('../../config/routes')
const urlPrefix = require('../../config').urlPrefix
const { setEndemicsClaim, getEndemicsClaim, setTempClaimReference } = require('../../session')
const { submitNewClaim } = require('../../api-requests/claim-service-api')
const { getSpeciesEligibleNumberForDisplay, getVaccinationStatusForDisplay, upperFirstLetter, formatDate } = require('../../lib/display-helpers')
const { getLivestockTypes } = require('../../lib/get-livestock-types')
const { getReviewType } = require('../../lib/get-review-type')
const { sheepPackages, sheepTestTypes, sheepTestResultsType } = require('../../constants/sheep-test-types')

const pageUrl = `${urlPrefix}/${routes.endemicsCheckAnswers}`

// Helper function for getting backLink
const getBackLink = (isReview, isSheep) => isReview
  ? (isSheep ? `${urlPrefix}/${routes.endemicsTestUrn}` : `${urlPrefix}/${routes.endemicsTestResults}`)
  : (isSheep ? `${urlPrefix}/${routes.endemicsSheepTestResults}` : `${urlPrefix}/${routes.endemicsBiosecurity}`)

// Helper function for generating individual rows
const createRow = (keyText, valueHtml, href, visuallyHiddenText) => ({
  key: { text: keyText },
  value: { html: valueHtml },
  actions: { items: [{ href, text: 'Change', visuallyHiddenText }] }
})

// Helper function for vet details rows
const getVetDetailsRows = (vetsName, vetRCVSNumber) => [
  createRow('Vet\'s name', upperFirstLetter(vetsName), `${urlPrefix}/${routes.endemicsVetName}`, 'vet\'s name'),
  createRow('Vet\'s RCVS number', vetRCVSNumber, `${urlPrefix}/${routes.endemicsVetRCVS}`, 'vet\'s rcvs number')
]

// Helper function for species-specific rows
const speciesSpecificRows = (sessionData, typeOfLivestock, typeOfReview, isEndemicsFollowUp, isBeef, isDairy, isPigs, isSheep) => {
  const { speciesNumbers, vetsName, vetRCVSNumber, numberAnimalsTested, piHunt, piHuntRecommended, piHuntAllAnimals, laboratoryURN, testResults, diseaseStatus, herdVaccinationStatus, biosecurity, numberOfOralFluidSamples, numberOfSamplesTested, sheepEndemicsPackage, sheepTestResults } = sessionData

  const livestockRows = [
    createRow('Business name', upperFirstLetter(sessionData.organisation?.name)),
    createRow('Livestock', upperFirstLetter((isPigs || isSheep) ? typeOfLivestock : `${typeOfLivestock} cattle`)),
    createRow('Review or follow-up', getReviewType(typeOfReview).isReview ? 'Animal health and welfare review' : 'Endemic disease follow-up'),
    createRow(isReview ? 'Date of review' : 'Date of follow-up', formatDate(sessionData.dateOfVisit), `${urlPrefix}/${routes.endemicsDateOfVisit}`, `date of ${getReviewType(typeOfReview).isReview ? 'review' : 'follow-up'}`),
    ...(sessionData.dateOfTesting ? [createRow('Date of sampling', formatDate(sessionData.dateOfTesting), `${urlPrefix}/${routes.endemicsDateOfTesting}`, 'date of sampling')] : []),
    createRow(getSpeciesEligibleNumberForDisplay(sessionData, true), upperFirstLetter(speciesNumbers), `${urlPrefix}/${routes.endemicsSpeciesNumbers}`, 'number of species'),
    createRow('Number of samples taken', numberAnimalsTested, `${urlPrefix}/${routes.endemicsNumberOfSpeciesTested}`, 'number of samples taken'),
    ...getVetDetailsRows(vetsName, vetRCVSNumber)
  ]

  // Additional rows based on livestock type
  if (isBeef || isDairy) {
    return [
      ...livestockRows,
      createRow('PI hunt', upperFirstLetter(piHunt), `${urlPrefix}/${routes.endemicsPIHunt}`, 'the pi hunt'),
      createRow('Vet recommended PI hunt', upperFirstLetter(piHuntRecommended), `${urlPrefix}/${routes.endemicsPIHuntRecommended}`, 'the pi hunt recommended'),
      createRow('PI hunt done on all cattle in herd', upperFirstLetter(piHuntAllAnimals), `${urlPrefix}/${routes.endemicsPIHuntAllAnimals}`, 'the pi hunt'),
      createRow(isBeef || isDairy ? 'URN or test certificate' : 'URN', laboratoryURN, `${urlPrefix}/${routes.endemicsTestUrn}`, 'URN'),
      createRow('Test results', upperFirstLetter(testResults), `${urlPrefix}/${routes.endemicsTestResults}`, 'test results'),
      ...(isEndemicsFollowUp ? [createRow('Biosecurity assessment', upperFirstLetter(biosecurity), `${urlPrefix}/${routes.endemicsBiosecurity}`, 'biosecurity assessment')] : [])
    ]
  } else if (isPigs) {
    return [
      ...livestockRows,
      createRow('Herd PRRS vaccination status', getVaccinationStatusForDisplay(herdVaccinationStatus), `${urlPrefix}/${routes.endemicsVaccination}`, 'herd PRRS vaccination status'),
      ...(numberOfOralFluidSamples ? [createRow('Number of oral fluid samples taken', numberOfOralFluidSamples, `${urlPrefix}/${routes.endemicsNumberOfOralFluidSamples}`, 'number of oral fluid samples taken')] : []),
      ...(numberOfSamplesTested ? [createRow('Number of samples tested', numberOfSamplesTested, `${urlPrefix}/${routes.endemicsNumberOfSamplesTested}`, 'number of samples tested')] : []),
      ...(diseaseStatus ? [createRow('Disease status category', diseaseStatus, `${urlPrefix}/${routes.endemicsDiseaseStatus}`, 'disease status category')] : [])
    ]
  } else if (isSheep) {
    const sheepRows = [
      createRow('Sheep health package', sheepPackages[sheepEndemicsPackage], `${urlPrefix}/${routes.endemicsSheepEndemicsPackage}`, 'sheep health package')
    ]

    if (sheepTestResults && sheepTestResults.length) {
      sheepRows.push({
        key: { text: 'Diseases or conditions tested for' },
        value: { html: sheepTestResults.map(sheepTest => `${sheepTestTypes[sheepEndemicsPackage].find(test => test.value === sheepTest.diseaseType).text}</br>`).join(' ') },
        actions: { items: [{ href: `${urlPrefix}/${routes.endemicsSheepTests}`, text: 'Change', visuallyHiddenText: 'diseases or conditions tested for' }] }
      })
    }

    return [...livestockRows, ...sheepRows]
  }

  return livestockRows
}

// Route definition
module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const sessionData = getEndemicsClaim(request)
        const { typeOfLivestock, typeOfReview } = sessionData
        const { isBeef, isDairy, isPigs, isSheep } = getLivestockTypes(typeOfLivestock)
        const { isEndemicsFollowUp } = getReviewType(typeOfReview)

        const rows = speciesSpecificRows(sessionData, typeOfLivestock, typeOfReview, isEndemicsFollowUp, isBeef, isDairy, isPigs, isSheep)
        const backLink = getBackLink(isReview, isSheep)

        const rowsWithData = rows.filter(row => row.value?.html !== undefined)
        return h.view(routes.endemicsCheckAnswers, { listData: { rows: rowsWithData }, backLink })
      }
    }
  },
  {
    method: 'POST',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const sessionData = getEndemicsClaim(request)
        const claim = await submitNewClaim({
          applicationReference: sessionData.latestEndemicsApplication?.reference,
          type: sessionData.typeOfReview,
          createdBy: 'admin',
          data: {
            ...sessionData,
            ...(getReviewType(sessionData.typeOfReview).isEndemicsFollowUp && getLivestockTypes(sessionData.typeOfLivestock).isSheep && {
              testResults: sessionData.sheepTestResults?.map(sheepTest => ({
                diseaseType: sheepTest.diseaseType,
                result: typeof sheepTest.result === 'object'
                  ? sheepTest.result.map(testResult => ({ diseaseType: testResult.diseaseType, result: testResult.testResult }))
                  : sheepTest.result
              }))
            })
          }
        })

        setEndemicsClaim(request, 'reference', claim.reference)
        setEndemicsClaim(request, 'amount', claim.data?.amount)
        setTempClaimReference(request, 'tempClaimReference', sessionData.reference)

        return h.redirect(`${urlPrefix}/${routes.endemicsConfirmation}`)
      }
    }
  }
]
