import { generatePigStatusAnswerRows } from '../../../../../app/routes/utils/generate-answer-rows.js'

describe('Latest Applications Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
