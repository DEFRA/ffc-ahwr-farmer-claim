import appInsights from 'applicationinsights'
import { getEndemicsClaim, setEndemicsClaim, setTempClaimReference } from '../../session/index.js'
import routes from '../../config/routes.js'
import {
  formatDate,
  getSpeciesEligibleNumberForDisplay,
  getVaccinationStatusForDisplay,
  upperFirstLetter
} from '../../lib/display-helpers.js'
import { getLivestockTypes } from '../../lib/get-livestock-types.js'
import { getReviewType } from '../../lib/get-review-type.js'
import { sheepPackages, sheepTestResultsType, sheepTestTypes } from '../../constants/sheep-test-types.js'
import { submitNewClaim } from '../../api-requests/claim-service-api.js'
import { isMultipleHerdsUserJourney } from '../../lib/context-helper.js'
import { generatePigStatusAnswerRows } from '../utils/generate-answer-rows.js'
import { prefixUrl } from '../utils/page-utils.js'

const pageUrl = prefixUrl(routes.endemicsCheckAnswers)

const getBackLink = (isReview, isSheep) => {
  if (isReview) {
    return isSheep
      ? prefixUrl(routes.endemicsTestUrn)
      : prefixUrl(routes.endemicsTestResults)
  }
  return isSheep
    ? prefixUrl(routes.endemicsSheepTestResults)
    : prefixUrl(routes.endemicsBiosecurity)
}
const getNoChangeRows = ({ isReview, isPigs, isSheep, typeOfLivestock, dateOfVisit, organisationName, herdName, agreementFlags }) => [
  {
    key: { text: 'Business name' },
    value: { html: upperFirstLetter(organisationName) }
  },
  {
    key: { text: isMultipleHerdsUserJourney(dateOfVisit, agreementFlags) ? 'Species' : 'Livestock' },
    value: {
      html: upperFirstLetter(
        isPigs || isSheep ? typeOfLivestock : `${typeOfLivestock} cattle`
      )
    }
  },
  ...(isMultipleHerdsUserJourney(dateOfVisit, agreementFlags) ? [getHerdNameRow(herdName, typeOfLivestock)] : []),
  {
    key: { text: 'Review or follow-up' },
    value: {
      html: isReview
        ? 'Animal health and welfare review'
        : 'Endemic disease follow-up'
    }
  }
]
const getBiosecurityAssessmentRow = (isPigs, sessionData) => {
  return createdHerdRowObject('Biosecurity assessment',
    isPigs && sessionData.biosecurity
      ? upperFirstLetter(
        `${sessionData.biosecurity?.biosecurity}, Assessment percentage: ${sessionData.biosecurity?.assessmentPercentage}%`
        )
      : upperFirstLetter(sessionData.biosecurity),
    routes.endemicsBiosecurity,
    'biosecurity assessment')
}
const getDateOfVisitRow = (isReview, dateOfVisit) => {
  return createdHerdRowObject(isReview ? 'Date of review' : 'Date of follow-up', formatDate(dateOfVisit), routes.endemicsDateOfVisit, `date of ${isReview ? 'review' : 'follow-up'}`)
}
const getDateOfSamplingRow = (dateOfTesting) => {
  return createdHerdRowObject('Date of sampling', formatDate(dateOfTesting), routes.endemicsDateOfTesting, 'date of sampling')
}
const getSheepDiseasesTestedRow = (isEndemicsFollowUp, sessionData) => {
  if (isEndemicsFollowUp && sessionData.sheepTestResults?.length) {
    const testList = sessionData.sheepTestResults
      .map(
        (sheepTest) =>
          `${sheepTestTypes[sessionData.sheepEndemicsPackage].find(
            (test) => test.value === sheepTest.diseaseType
          ).text
          }</br>`
      )
      .join(' ')
    return createdHerdRowObject('Diseases or conditions tested for', testList, routes.endemicsSheepTests, 'diseases or conditions tested for')
  }
  return {}
}
const getHerdNameRow = (herdName, typeOfLivestock) => {
  return {
    key: { text: `${typeOfLivestock === 'sheep' ? 'Flock' : 'Herd'} name` },
    value: { html: herdName }
  }
}

const createdHerdRowObject = (keyText, htmlValue, href, visuallyHiddenText) => {
  return {
    key: { text: keyText },
    value: {
      html: htmlValue
    },
    actions: {
      items: [
        {
          href: prefixUrl(href),
          text: 'Change',
          visuallyHiddenText
        }
      ]
    }
  }
}

const getHandler = {
  method: 'GET',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const sessionData = getEndemicsClaim(request)
      const {
        organisation,
        typeOfLivestock,
        typeOfReview,
        dateOfVisit,
        dateOfTesting,
        speciesNumbers,
        vetsName,
        vetRCVSNumber,
        laboratoryURN,
        numberAnimalsTested,
        testResults,
        herdName,
        latestEndemicsApplication
      } = sessionData

      const { isBeef, isDairy, isPigs, isSheep } =
        getLivestockTypes(typeOfLivestock)
      const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)

      const backLink = getBackLink(isReview, isSheep)
      const dateOfVisitRow = getDateOfVisitRow(isReview, dateOfVisit)

      const dateOfSamplingRow = getDateOfSamplingRow(dateOfTesting)

      const speciesNumbersRow = createdHerdRowObject(getSpeciesEligibleNumberForDisplay(sessionData, true),
        upperFirstLetter(speciesNumbers), routes.endemicsSpeciesNumbers, 'number of species')

      const numberOfAnimalsTestedRow = createdHerdRowObject('Number of samples taken',
        numberAnimalsTested, routes.endemicsNumberOfSpeciesTested, 'number of samples taken')

      const vetDetailsRows = [
        createdHerdRowObject("Vet's name", upperFirstLetter(vetsName), routes.endemicsVetName, "vet's name"),
        createdHerdRowObject("Vet's RCVS number", vetRCVSNumber, routes.endemicsVetRCVS, "vet's rcvs number")
      ]
      const piHuntRow = createdHerdRowObject('PI hunt', upperFirstLetter(sessionData.piHunt), routes.endemicsPIHunt, 'the pi hunt')

      const piHuntRecommendedRow = createdHerdRowObject('Vet recommended PI hunt', upperFirstLetter(sessionData.piHuntRecommended), routes.endemicsPIHuntRecommended, 'the pi hunt recommended')

      const piHuntAllAnimalsRow = createdHerdRowObject('PI hunt done on all cattle in herd', upperFirstLetter(sessionData.piHuntAllAnimals), routes.endemicsPIHuntAllAnimals, 'the pi hunt')

      const laboratoryUrnRow = createdHerdRowObject(isBeef || isDairy ? 'URN or test certificate' : 'URN', laboratoryURN, routes.endemicsTestUrn, 'URN')

      const oralFluidSamplesRow = createdHerdRowObject('Number of oral fluid samples taken', sessionData.numberOfOralFluidSamples, routes.endemicsNumberOfOralFluidSamples, 'number of oral fluid samples taken')

      const testResultsRow = createdHerdRowObject(isReview ? 'Test results' : 'Follow-up test result', upperFirstLetter(testResults), routes.endemicsTestResults, 'test results')

      const vetVisitsReviewTestResultsRow = createdHerdRowObject('Review test result', upperFirstLetter(sessionData.vetVisitsReviewTestResults), routes.endemicsVetVisitsReviewTestResults, 'review test results')

      const samplesTestedRow = createdHerdRowObject('Number of samples tested', sessionData.numberOfSamplesTested, routes.endemicsNumberOfSamplesTested, 'number of samples tested')

      const herdVaccinationStatusRow = createdHerdRowObject('Herd PRRS vaccination status', getVaccinationStatusForDisplay(
        sessionData.herdVaccinationStatus
      ), routes.endemicsVaccination, 'herd PRRS vaccination status')

      const biosecurityAssessmentRow = getBiosecurityAssessmentRow(
        isPigs,
        sessionData
      )
      const sheepPackageRow = createdHerdRowObject('Sheep health package', sheepPackages[sessionData.sheepEndemicsPackage], routes.endemicsSheepEndemicsPackage, 'sheep health package')

      const sheepDiseasesTestedRow = getSheepDiseasesTestedRow(
        isEndemicsFollowUp,
        sessionData
      )

      const beefRows = [
        vetVisitsReviewTestResultsRow,
        dateOfVisitRow,
        isReview && dateOfSamplingRow,
        speciesNumbersRow,
        numberOfAnimalsTestedRow,
        ...vetDetailsRows,
        piHuntRow,
        piHuntRecommendedRow,
        piHuntAllAnimalsRow,
        isEndemicsFollowUp && dateOfSamplingRow,
        laboratoryUrnRow,
        testResultsRow,
        isEndemicsFollowUp && biosecurityAssessmentRow
      ]
      const dairyRows = [
        vetVisitsReviewTestResultsRow,
        dateOfVisitRow,
        isReview && dateOfSamplingRow,
        speciesNumbersRow,
        numberOfAnimalsTestedRow,
        ...vetDetailsRows,
        piHuntRow,
        piHuntRecommendedRow,
        piHuntAllAnimalsRow,
        isEndemicsFollowUp && dateOfSamplingRow,
        laboratoryUrnRow,
        testResultsRow,
        isEndemicsFollowUp && biosecurityAssessmentRow
      ]
      const pigRows = [
        dateOfVisitRow,
        dateOfSamplingRow,
        speciesNumbersRow,
        numberOfAnimalsTestedRow,
        ...vetDetailsRows,
        vetVisitsReviewTestResultsRow,
        herdVaccinationStatusRow,
        laboratoryUrnRow,
        oralFluidSamplesRow, // review claim
        testResultsRow,
        samplesTestedRow, // endemics claim
        ...generatePigStatusAnswerRows(sessionData),
        isEndemicsFollowUp && biosecurityAssessmentRow
      ]
      const sheepRows = [
        dateOfVisitRow,
        dateOfSamplingRow,
        speciesNumbersRow,
        numberOfAnimalsTestedRow,
        ...vetDetailsRows,
        laboratoryUrnRow,
        testResultsRow,
        sheepPackageRow,
        sheepDiseasesTestedRow,
        ...(isEndemicsFollowUp && sessionData.sheepTestResults?.length
          ? (sessionData.sheepTestResults || []).map((sheepTest, index) => (
              {
                key: {
                  text: index === 0 ? 'Disease or condition test result' : ''
                },
                value: {
                  html: typeof sheepTest.result === 'object'
                    ? sheepTest.result.map((testResult) => `${testResult.diseaseType} (${testResult.testResult})</br>`).join(' ')
                    : `${sheepTestTypes[sessionData.sheepEndemicsPackage].find(({ value }) => value === sheepTest.diseaseType).text} (${sheepTestResultsType[sheepTest.diseaseType].find((resultType) => resultType.value === sheepTest.result).text})`
                },
                actions: {
                  items: [
                    {
                      href: prefixUrl(`${routes.endemicsSheepTestResults}?diseaseType=${sheepTest.diseaseType}`),
                      text: 'Change',
                      visuallyHiddenText: `disease type ${sheepTest.diseaseType} and test result`
                    }
                  ]
                }
              }))
          : []
        )
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
        ...getNoChangeRows({ isReview, isPigs, isSheep, typeOfLivestock, dateOfVisit, organisationName: organisation?.name, herdName, agreementFlags: latestEndemicsApplication.flags }),
        ...speciesRows()
      ]

      const rowsWithData = rows.filter((row) => row.value?.html !== undefined)
      return h.view(routes.endemicsCheckAnswers, {
        listData: { rows: rowsWithData },
        backLink
      })
    }
  }
}

const postHandler = {
  method: 'POST',
  path: pageUrl,
  options: {
    handler: async (request, h) => {
      const {
        typeOfLivestock, typeOfReview, dateOfVisit, dateOfTesting, speciesNumbers, vetsName, vetRCVSNumber, laboratoryURN, piHunt, piHuntRecommended, piHuntAllAnimals, numberOfOralFluidSamples,
        numberAnimalsTested, testResults, latestEndemicsApplication, vetVisitsReviewTestResults, sheepTestResults, biosecurity, herdVaccinationStatus, diseaseStatus, pigsFollowUpTest, pigsElisaTestResult,
        pigsPcrTestResult, pigsGeneticSequencing, sheepEndemicsPackage, numberOfSamplesTested, reference: tempClaimReference, reviewTestResults, herdId, herdVersion, herdName, herdCph, herdReasons, herdSame
      } = getEndemicsClaim(request)

      const { isSheep } = getLivestockTypes(typeOfLivestock)
      const { isEndemicsFollowUp } = getReviewType(typeOfReview)

      const claim = await submitNewClaim({
        applicationReference: latestEndemicsApplication?.reference,
        reference: tempClaimReference,
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
          piHunt,
          piHuntRecommended,
          piHuntAllAnimals,
          numberOfOralFluidSamples,
          numberAnimalsTested,
          testResults,
          vetVisitsReviewTestResults,
          biosecurity,
          herdVaccinationStatus,
          diseaseStatus,
          pigsFollowUpTest,
          pigsElisaTestResult,
          pigsPcrTestResult,
          pigsGeneticSequencing,
          sheepEndemicsPackage,
          numberOfSamplesTested,
          reviewTestResults,
          ...(isEndemicsFollowUp && isSheep && {
            testResults: sheepTestResults?.map(sheepTest => ({
              diseaseType: sheepTest.diseaseType,
              result: typeof sheepTest.result === 'object' ? sheepTest.result.map(testResult => ({ diseaseType: testResult.diseaseType, result: testResult.testResult })) : sheepTest.result
            }))
          }),
          ...(isMultipleHerdsUserJourney(dateOfVisit, latestEndemicsApplication.flags) && {
            herd: {
              herdId,
              herdVersion,
              herdName,
              cph: herdCph,
              herdReasons,
              herdSame
            }
          })
        }
      }, request.logger)

      setEndemicsClaim(request, 'reference', claim.reference)
      setEndemicsClaim(request, 'amount', claim.data?.amount)
      setTempClaimReference(request, 'tempClaimReference', tempClaimReference)

      appInsights.defaultClient.trackEvent({
        name: 'claim-submitted',
        properties: {
          tempClaimReference,
          claimReference: claim.reference,
          scheme: 'new-world'
        }
      })

      return h.redirect(
        prefixUrl(routes.endemicsConfirmation)
      )
    }
  }
}

export const checkAnswersHandlers = [getHandler, postHandler]
