import { generatePigStatusAnswerRows } from '../../../../../app/routes/utils/generate-answer-rows.js'
import { config } from '../../../../../app/config/index.js'

describe('Latest Applications Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('when pigUpdates disabled, returns disease status row', () => {
    config.pigUpdates.enabled = false
    const sessionData = {
      diseaseStatus: '3'
    }

    const rows = generatePigStatusAnswerRows(sessionData)

    expect(rows).toHaveLength(1)
    expect(rows[0].key.text).toBe('Disease status category')
    expect(rows[0].value.html).toBe('3')
  })

  describe('pig updates enabled', () => {
    beforeAll(() => {
      config.pigUpdates.enabled = true
    })

    afterAll(() => {
      config.pigUpdates.enabled = false
    })

    test('returns elisa rows', () => {
      const sessionData = {
        pigsElisaTestResult: 'negative'
      }

      const rows = generatePigStatusAnswerRows(sessionData)

      expect(rows).toHaveLength(2)
      expect(rows[0].key.text).toBe('Test result')
      expect(rows[0].value.html).toBe('ELISA negative')
      expect(rows[1].key.text).toBe('Genetic sequencing test results')
      expect(rows[1].value.html).toBeUndefined()
    })

    test('returns pcr negative rows', () => {
      const sessionData = {
        pigsPcrTestResult: 'negative'
      }

      const rows = generatePigStatusAnswerRows(sessionData)

      expect(rows).toHaveLength(2)
      expect(rows[0].key.text).toBe('Test result')
      expect(rows[0].value.html).toBe('PCR negative')
      expect(rows[1].key.text).toBe('Genetic sequencing test results')
      expect(rows[1].value.html).toBeUndefined()
    })

    test('returns pcr positive rows', () => {
      const sessionData = {
        pigsPcrTestResult: 'positive',
        pigsGeneticSequencing: 'mlv'
      }

      const rows = generatePigStatusAnswerRows(sessionData)

      expect(rows).toHaveLength(2)
      expect(rows[0].key.text).toBe('Test result')
      expect(rows[0].value.html).toBe('PCR positive')
      expect(rows[1].key.text).toBe('Genetic sequencing test results')
      expect(rows[1].value.html).toBe('Modified Live virus (MLV) only')
    })
  })
})
