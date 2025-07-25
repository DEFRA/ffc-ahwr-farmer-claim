import appInsights from 'applicationinsights'
import { config } from '../../config/index.js'
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

const urlPrefix = config.urlPrefix

const pageUrl = `${urlPrefix}/${routes.endemicsCheckAnswers}`

const getBackLink = (isReview, isSheep) => {
  if (isReview) {
    return isSheep
      ? `${urlPrefix}/${routes.endemicsTestUrn}`
      : `${urlPrefix}/${routes.endemicsTestResults}`
  }
  return isSheep
    ? `${urlPrefix}/${routes.endemicsSheepTestResults}`
    : `${urlPrefix}/${routes.endemicsBiosecurity}`
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
  return {
    key: { text: 'Biosecurity assessment' }, // Pigs - Beef - Dairy
    value: {
      html:
        isPigs && sessionData?.biosecurity
          ? upperFirstLetter(
            `${sessionData?.biosecurity?.biosecurity}, Assessment percentage: ${sessionData?.biosecurity?.assessmentPercentage}%`
            )
          : upperFirstLetter(sessionData?.biosecurity)
    },
    actions: {
      items: [
        {
          href: `${urlPrefix}/${routes.endemicsBiosecurity}`,
          text: 'Change',
          visuallyHiddenText: 'biosecurity assessment'
        }
      ]
    }
  }
}
const getDateOfVisitRow = (isReview, dateOfVisit) => {
  return {
    key: { text: isReview ? 'Date of review' : 'Date of follow-up' },
    value: { html: formatDate(dateOfVisit) },
    actions: {
      items: [
        {
          href: `${urlPrefix}/${routes.endemicsDateOfVisit}`,
          text: 'Change',
          visuallyHiddenText: `date of ${isReview ? 'review' : 'follow-up'}`
        }
      ]
    }
  }
}
const getDateOfSamplingRow = (dateOfTesting) => {
  return {
    key: { text: 'Date of sampling' },
    value: { html: dateOfTesting && formatDate(dateOfTesting) },
    actions: {
      items: [
        {
          href: `${urlPrefix}/${routes.endemicsDateOfTesting}`,
          text: 'Change',
          visuallyHiddenText: 'date of sampling'
        }
      ]
    }
  }
}
const getSheepDiseasesTestedRow = (isEndemicsFollowUp, sessionData) => {
  if (isEndemicsFollowUp && sessionData?.sheepTestResults?.length) {
    const testList = sessionData?.sheepTestResults
      .map(
        (sheepTest) =>
          `${sheepTestTypes[sessionData?.sheepEndemicsPackage].find(
            (test) => test.value === sheepTest.diseaseType
          ).text
          }</br>`
      )
      .join(' ')
    return {
      key: { text: 'Diseases or conditions tested for' }, // Sheep
      value: { html: testList },
      actions: {
        items: [
          {
            href: `${urlPrefix}/${routes.endemicsSheepTests}`,
            text: 'Change',
            visuallyHiddenText: 'diseases or conditions tested for'
          }
        ]
      }
    }
  }
  return {}
}
const getHerdNameRow = (herdName, typeOfLivestock) => {
  return {
    key: { text: `${typeOfLivestock === 'sheep' ? 'Flock' : 'Herd'} name` },
    value: { html: herdName }
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

      const speciesNumbersRow = {
        key: { text: getSpeciesEligibleNumberForDisplay(sessionData, true) },
        value: { html: upperFirstLetter(speciesNumbers) },
        actions: {
          items: [
            {
              href: `${urlPrefix}/${routes.endemicsSpeciesNumbers}`,
              text: 'Change',
              visuallyHiddenText: 'number of species'
            }
          ]
        }
      }
      const numberOfAnimalsTestedRow = {
        key: { text: 'Number of samples taken' }, // Pigs, Beef, Sheep
        value: { html: numberAnimalsTested },
        actions: {
          items: [
            {
              href: `${urlPrefix}/${routes.endemicsNumberOfSpeciesTested}`,
              text: 'Change',
              visuallyHiddenText: 'number of samples taken'
            }
          ]
        }
      }
      const vetDetailsRows = [
        {
          key: { text: "Vet's name" },
          value: { html: upperFirstLetter(vetsName) },
          actions: {
            items: [
              {
                href: `${urlPrefix}/${routes.endemicsVetName}`,
                text: 'Change',
                visuallyHiddenText: "vet's name"
              }
            ]
          }
        },
        {
          key: { text: "Vet's RCVS number" },
          value: { html: vetRCVSNumber },
          actions: {
            items: [
              {
                href: `${urlPrefix}/${routes.endemicsVetRCVS}`,
                text: 'Change',
                visuallyHiddenText: "vet's rcvs number"
              }
            ]
          }
        }
      ]
      const piHuntRow = {
        key: { text: 'PI hunt' },
        value: { html: upperFirstLetter(sessionData?.piHunt) },
        actions: {
          items: [
            {
              href: `${urlPrefix}/${routes.endemicsPIHunt}`,
              text: 'Change',
              visuallyHiddenText: 'the pi hunt'
            }
          ]
        }
      }
      const piHuntRecommendedRow = {
        key: { text: 'Vet recommended PI hunt' },
        value: { html: upperFirstLetter(sessionData?.piHuntRecommended) },
        actions: {
          items: [
            {
              href: `${urlPrefix}/${routes.endemicsPIHuntRecommended}`,
              text: 'Change',
              visuallyHiddenText: 'the pi hunt recommended'
            }
          ]
        }
      }
      const piHuntAllAnimalsRow = {
        key: { text: 'PI hunt done on all cattle in herd' },
        value: { html: upperFirstLetter(sessionData?.piHuntAllAnimals) },
        actions: {
          items: [
            {
              href: `${urlPrefix}/${routes.endemicsPIHuntAllAnimals}`,
              text: 'Change',
              visuallyHiddenText: 'the pi hunt'
            }
          ]
        }
      }
      const laboratoryUrnRow = {
        key: { text: isBeef || isDairy ? 'URN or test certificate' : 'URN' },
        value: { html: laboratoryURN },
        actions: {
          items: [
            {
              href: `${urlPrefix}/${routes.endemicsTestUrn}`,
              text: 'Change',
              visuallyHiddenText: 'URN'
            }
          ]
        }
      }
      const oralFluidSamplesRow = {
        key: { text: 'Number of oral fluid samples taken' }, // Pigs
        value: { html: sessionData?.numberOfOralFluidSamples },
        actions: {
          items: [
            {
              href: `${urlPrefix}/${routes.endemicsNumberOfOralFluidSamples}`,
              text: 'Change',
              visuallyHiddenText: 'number of oral fluid samples taken'
            }
          ]
        }
      }
      const testResultsRow = {
        key: { text: isReview ? 'Test results' : 'Follow-up test result' }, // Pigs, Dairy, Beef
        value: { html: testResults && upperFirstLetter(testResults) },
        actions: {
          items: [
            {
              href: `${urlPrefix}/${routes.endemicsTestResults}`,
              text: 'Change',
              visuallyHiddenText: 'test results'
            }
          ]
        }
      }
      const vetVisitsReviewTestResultsRow = {
        key: { text: 'Review test result' }, // Pigs, Dairy, Beef, when coming from old world agreement
        value: {
          html: upperFirstLetter(sessionData?.vetVisitsReviewTestResults)
        },
        actions: {
          items: [
            {
              href: `${urlPrefix}/${routes.endemicsVetVisitsReviewTestResults}`,
              text: 'Change',
              visuallyHiddenText: 'review test results'
            }
          ]
        }
      }

      const samplesTestedRow = {
        key: { text: 'Number of samples tested' }, // Pigs
        value: { html: sessionData?.numberOfSamplesTested },
        actions: {
          items: [
            {
              href: `${urlPrefix}/${routes.endemicsNumberOfSamplesTested}`,
              text: 'Change',
              visuallyHiddenText: 'number of samples tested'
            }
          ]
        }
      }
      const herdVaccinationStatusRow = {
        key: { text: 'Herd PRRS vaccination status' }, // Pigs
        value: {
          html: getVaccinationStatusForDisplay(
            sessionData?.herdVaccinationStatus
          )
        },
        actions: {
          items: [
            {
              href: `${urlPrefix}/${routes.endemicsVaccination}`,
              text: 'Change',
              visuallyHiddenText: 'herd PRRS vaccination status'
            }
          ]
        }
      }
      const biosecurityAssessmentRow = getBiosecurityAssessmentRow(
        isPigs,
        sessionData
      )
      const sheepPackageRow = {
        key: { text: 'Sheep health package' }, // Sheep
        value: { html: sheepPackages[sessionData?.sheepEndemicsPackage] },
        actions: {
          items: [
            {
              href: `${urlPrefix}/${routes.endemicsSheepEndemicsPackage}`,
              text: 'Change',
              visuallyHiddenText: 'sheep health package'
            }
          ]
        }
      }
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
        ...(isEndemicsFollowUp && sessionData?.sheepTestResults?.length
          ? (sessionData?.sheepTestResults || []).map((sheepTest, index) => (
              {
                key: {
                  text: index === 0 ? 'Disease or condition test result' : ''
                },
                value: {
                  html: typeof sheepTest.result === 'object'
                    ? sheepTest.result.map((testResult) => `${testResult.diseaseType} (${testResult.testResult})</br>`).join(' ')
                    : `${sheepTestTypes[sessionData?.sheepEndemicsPackage].find(({ value }) => value === sheepTest.diseaseType).text} (${sheepTestResultsType[sheepTest.diseaseType].find((resultType) => resultType.value === sheepTest.result).text})`
                },
                actions: {
                  items: [
                    {
                      href: `${urlPrefix}/${routes.endemicsSheepTestResults}?diseaseType=${sheepTest.diseaseType}`,
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
        typeOfLivestock,
        typeOfReview,
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
        latestEndemicsApplication,
        vetVisitsReviewTestResults,
        sheepTestResults,
        biosecurity,
        herdVaccinationStatus,
        diseaseStatus,
        pigsFollowUpTest,
        pigsElisaTestResult,
        pigsPcrTestResult,
        pigsGeneticSequencing,
        sheepEndemicsPackage,
        numberOfSamplesTested,
        reference: tempClaimReference,
        reviewTestResults,
        herdId,
        herdVersion,
        herdName,
        herdCph,
        herdReasons,
        herdSame
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
        `${urlPrefix}/${routes.endemicsConfirmation}`
      )
    }
  }
}

export const checkAnswersHandlers = [getHandler, postHandler]
