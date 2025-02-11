import { getLatestApplication } from '../../../../app/lib/get-latest-application.js'

describe('getLatestApplication', () => {
  test('returns the latest application', () => {
    const applications = [
      { createdAt: '2022-01-01T00:00:00.000Z' },
      { createdAt: '2023-01-01T00:00:00.000Z' },
      { createdAt: '2022-06-01T00:00:00.000Z' }
    ]
    const expected = { createdAt: '2023-01-01T00:00:00.000Z' }
    expect(getLatestApplication(applications)).toEqual(expected)
  })

  test('returns an empty object if no applications', () => {
    const applications = []
    const expected = {}
    expect(getLatestApplication(applications)).toEqual(expected)
  })

  test('returns the only application if only one', () => {
    const applications = [{ createdAt: '2022-01-01T00:00:00.000Z' }]
    const expected = { createdAt: '2022-01-01T00:00:00.000Z' }
    expect(getLatestApplication(applications)).toEqual(expected)
  })
})
