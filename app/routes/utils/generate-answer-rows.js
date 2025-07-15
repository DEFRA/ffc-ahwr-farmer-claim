import routes from '../../config/routes.js'
import { config } from '../../config/index.js'
import { PIG_GENETIC_SEQUENCING_VALUES } from 'ffc-ahwr-common-library'

const urlPrefix = config.urlPrefix

export const generatePigStatusAnswerRows = (sessionData) => {
  const diseaseStatusRow = {
    key: { text: 'Disease status category' },
    value: { html: sessionData.diseaseStatus },
    actions: {
      items: [
        {
          href: `${urlPrefix}/${routes.endemicsDiseaseStatus}`,
          text: 'Change',
          visuallyHiddenText: 'disease status category'
        }
      ]
    }
  }

  const testResultRow = {
    key: { text: 'Test result' },
    value: { html: prefixResultForTestType(sessionData.pigsElisaTestResult, sessionData.pigsPcrTestResult) },
    actions: {
      items: [
        {
          href: `${urlPrefix}/${sessionData.pigsElisaTestResult ? routes.endemicsPigsElisaResult : routes.endemicsPigsPcrResult}`,
          text: 'Change',
          visuallyHiddenText: 'test result'
        }
      ]
    }
  }

  const geneticSequencingResultRow = {
    key: { text: 'Genetic sequencing test results' },
    value: { html: PIG_GENETIC_SEQUENCING_VALUES.find(x => x.value === sessionData.pigsGeneticSequencing)?.label },
    actions: {
      items: [
        {
          href: `${urlPrefix}/${routes.endemicsPigsGeneticSequencing}`,
          text: 'Change',
          visuallyHiddenText: 'genetic sequencing test results'
        }
      ]
    }
  }

  return config.pigUpdates.enabled ? [testResultRow, geneticSequencingResultRow] : [diseaseStatusRow]
}

const prefixResultForTestType = (elisaValue, pcrValue) => {
  if (elisaValue) {
    return `ELISA ${elisaValue}`
  }

  if (pcrValue) {
    return `PCR ${pcrValue}`
  }
  return undefined
}
