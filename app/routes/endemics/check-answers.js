const routes = require('../../config/routes')
const urlPrefix = require('../../config').urlPrefix
const { setEndemicsClaim, getEndemicsClaim } = require('../../session')
const { submitNewClaim } = require('../../api-requests/claim-service-api')
const { getSpeciesEligibleNumberForDisplay, upperFirstLetter, formatDate } = require('../../lib/display-helpers')
const { getLivestockTypes } = require('../../lib/get-livestock-types')
const { getReviewType } = require('../../lib/get-review-type')
const { sheepPackages, sheepTestTypes, sheepTestResultsType } = require('../../constants/sheep-test-types')

const pageUrl = `${urlPrefix}/${routes.endemicsCheckAnswers}`

const getBackLink = (isReview, isSheep) => {
  if (isReview) {
    return isSheep ? `${urlPrefix}/${routes.endemicsTestUrn}` : `${urlPrefix}/${routes.endemicsTestResults}`
  } else {
    return isSheep ? `${urlPrefix}/${routes.endemicsSheepTestResults}` : `${urlPrefix}/${routes.endemicsBiosecurity}`
  }
}

module.exports = [
  {
    method: 'GET',
    path: pageUrl,
    options: {
      handler: async (request, h) => {
        const sessionData = getEndemicsClaim(request)
        const { organisation, typeOfLivestock, typeOfReview, dateOfVisit, dateOfTesting, speciesNumbers, vetsName, vetRCVSNumber, laboratoryURN, numberAnimalsTested, testResults } = sessionData

        const { isBeef, isDairy, isPigs, isSheep } = getLivestockTypes(typeOfLivestock)
        const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)

        const backLink = getBackLink(isReview, isSheep)

        const noChangeRows = [{
          key: { text: 'Business name' },
          value: { html: upperFirstLetter(organisation?.name) }
        },
        {
          key: { text: 'Livestock' },
          value: { html: upperFirstLetter((isPigs || isSheep) ? typeOfLivestock : `${typeOfLivestock} cattle`) }
        },
        {
          key: { text: 'Review or follow-up' },
          value: { html: isReview ? 'Annual health and welfare review' : 'Endemic disease follow-up' }
        }]

        const commonRowsWithChangeLinks = [
          {
            key: { text: isReview ? 'Date of review' : 'Date of follow-up' },
            value: { html: formatDate(dateOfVisit) },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsDateOfVisit}`, text: 'Change', visuallyHiddenText: `change date of ${isReview ? 'review' : 'follow-up'}` }] }
          },
          {
            key: { text: 'Date of sampling' },
            value: { html: formatDate(dateOfTesting) },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsDateOfTesting}`, text: 'Change', visuallyHiddenText: 'change date of sampling' }] }
          },
          {
            key: { text: getSpeciesEligibleNumberForDisplay(sessionData, true) },
            value: { html: upperFirstLetter(speciesNumbers) },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsSpeciesNumbers}`, text: 'Change', visuallyHiddenText: 'change number of species' }] }
          }
        ]
        const numberOfAnimalsTestedRow = {
          key: { text: 'Number of animals tested' }, // Pigs, Beef, Sheep
          value: { html: numberAnimalsTested },
          actions: { items: [{ href: `${urlPrefix}/${routes.endemicsNumberOfSpeciesTested}`, text: 'Change', visuallyHiddenText: 'change number of animals tested' }] }
        }
        const vetDetailsRows = [
          {
            key: { text: 'Vet\'s name' },
            value: { html: upperFirstLetter(vetsName) },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsVetName}`, text: 'Change', visuallyHiddenText: 'change vet\'s name' }] }
          },
          {
            key: { text: 'Vet\'s RCVS number' },
            value: { html: vetRCVSNumber },
            actions: { items: [{ href: `${urlPrefix}/${routes.endemicsVetRCVS}`, text: 'Change', visuallyHiddenText: 'change vet\'s rcvs number' }] }
          }
        ]
        const laboratoryUrnRow = {
          key: { text: 'Test results URN' },
          value: { html: laboratoryURN },
          actions: { items: [{ href: `${urlPrefix}/${routes.endemicsTestUrn}`, text: 'Change', visuallyHiddenText: 'change test URN' }] }
        }
        const oralFluidSamplesRow = {
          key: { text: 'Number of oral fluid samples taken' }, // Pigs
          value: { html: sessionData?.numberOfOralFluidSamples },
          actions: { items: [{ href: `${urlPrefix}/${routes.endemicsNumberOfOralFluidSamples}`, text: 'Change', visuallyHiddenText: 'change number of oral fluid samples taken' }] }
        }
        const testResultsRow = {
          key: { text: 'Test results' }, // Pigs, Dairy, Beef
          value: { html: testResults && upperFirstLetter(testResults) },
          actions: { items: [{ href: `${urlPrefix}/${routes.endemicsTestResults}`, text: 'Change', visuallyHiddenText: 'change test results' }] }
        }
        const vetVisitsReviewTestResultsRow = {
          key: { text: 'Review test result' }, // Pigs, Dairy, Beef, when coming from old world agreement
          value: { html: upperFirstLetter(sessionData?.vetVisitsReviewTestResults) },
          actions: { items: [{ href: `${urlPrefix}/${routes.endemicsVetVisitsReviewTestResults}`, text: 'Change', visuallyHiddenText: 'change review test results' }] }
        }
        const diseaseStatusRow = {
          key: { text: 'Diseases status category' }, // Pigs
          value: { html: sessionData?.diseaseStatus },
          actions: { items: [{ href: `${urlPrefix}/${routes.endemicsDiseaseStatus}`, text: 'Change', visuallyHiddenText: 'change diseases status category' }] }
        }
        const samplesTestedRow = {
          key: { text: 'Samples tested' }, // Pigs
          value: { html: sessionData?.numberOfSamplesTested },
          actions: { items: [{ href: `${urlPrefix}/${routes.endemicsNumberOfSamplesTested}`, text: 'Change', visuallyHiddenText: 'change number of samples tested' }] }
        }
        const herdVaccinationStatusRow = {
          key: { text: 'Herd vaccination status' }, // Pigs
          value: { html: upperFirstLetter(sessionData?.herdVaccinationStatus) },
          actions: { items: [{ href: `${urlPrefix}/${routes.endemicsVaccination}`, text: 'Change', visuallyHiddenText: 'change herd vaccination status' }] }
        }
        const biosecurityAssessmentRow = {
          key: { text: 'Biosecurity assessment' }, // Pigs - Beef - Dairy
          value: { html: isPigs ? upperFirstLetter(`${sessionData?.biosecurity?.biosecurity}, Assessment percentage: ${sessionData?.biosecurity?.assessmentPercentage}%`) : upperFirstLetter(sessionData?.biosecurity) },
          actions: { items: [{ href: `${urlPrefix}/${routes.endemicsBiosecurity}`, text: 'Change', visuallyHiddenText: 'change biosecurity assessment' }] }
        }
        const sheepPackageRow = {
          key: { text: 'Sheep health package' }, // Sheep
          value: { html: sheepPackages[sessionData?.sheepEndemicsPackage] },
          actions: { items: [{ href: `${urlPrefix}/${routes.endemicsSheepEndemicsPackage}`, text: 'Change', visuallyHiddenText: 'change sheep health package' }] }
        }

        const beefRows = [
          numberOfAnimalsTestedRow,
          ...vetDetailsRows,
          vetVisitsReviewTestResultsRow,
          laboratoryUrnRow,
          testResultsRow,
          isEndemicsFollowUp && biosecurityAssessmentRow
        ]
        const dairyRows = [
          numberOfAnimalsTestedRow,
          ...vetDetailsRows,
          vetVisitsReviewTestResultsRow,
          laboratoryUrnRow,
          testResultsRow,
          isEndemicsFollowUp && biosecurityAssessmentRow
        ]
        const pigRows = [
          numberOfAnimalsTestedRow,
          ...vetDetailsRows,
          vetVisitsReviewTestResultsRow,
          herdVaccinationStatusRow,
          laboratoryUrnRow,
          oralFluidSamplesRow, // review claim
          testResultsRow,
          samplesTestedRow, // endemics claim
          diseaseStatusRow,
          isEndemicsFollowUp && biosecurityAssessmentRow
        ]
        const sheepRows = [
          numberOfAnimalsTestedRow,
          ...vetDetailsRows,
          laboratoryUrnRow,
          testResultsRow,
          sheepPackageRow,
          ...(isEndemicsFollowUp && sessionData?.sheepTestResults?.length)
            ? (sessionData?.sheepTestResults || []).map((sheepTest, index) => {
                return {
                  key: { text: index === 0 ? 'Disease test and result' : '' },
                  value: {
                    html: typeof sheepTest.result === 'object'
                      ? sheepTest.result.map(testResult => `${testResult.diseaseType} (${testResult.testResult})</br>`).join(' ')
                      : `${sheepTestTypes[sessionData?.sheepEndemicsPackage].find((test) => test.value === sheepTest.diseaseType).text} (${sheepTestResultsType[sheepTest.diseaseType].find(resultType => resultType.value === sheepTest.result).text})`
                  },
                  actions: { items: [{ href: `${urlPrefix}/${routes.endemicsSheepTestResults}?diseaseType=${sheepTest.diseaseType}`, text: 'Change', visuallyHiddenText: `change disease type ${sheepTest.diseaseType} and test result` }] }
                }
              })
            : []
        ]

        const speciesRows = () => {
          switch (true) {
            case isBeef:
              return beefRows
            case isDairy:
              return dairyRows
            case isPigs:
              return pigRows
            case isSheep:
              return sheepRows
            default:
              return []
          }
        }

        const rows = [
          ...noChangeRows,
          ...commonRowsWithChangeLinks,
          ...speciesRows()
        ]

        const rowsWithData = rows.filter((row) => row.value?.html !== undefined)
        console.log('rowsWithData', rowsWithData)
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

        const { isSheep } = getLivestockTypes(typeOfLivestock)
        const { isEndemicsFollowUp } = getReviewType(typeOfReview)

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
            ...(isEndemicsFollowUp && isSheep && {
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
