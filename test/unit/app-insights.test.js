import appInsights from 'applicationinsights'
import * as insights from '../../app/insights.js'

jest.mock('applicationinsights', () => ({
  setup: jest.fn()
}))

describe('App Insight', () => {
  jest.mock('applicationinsights')

  const startMock = jest.fn()
  const setupMock = jest.fn(() => {
    return {
      start: startMock
    }
  })
  appInsights.setup = setupMock
  const cloudRoleTag = 'cloudRoleTag'
  const tags = {}
  appInsights.defaultClient = {
    context: {
      keys: {
        cloudRole: cloudRoleTag
      },
      tags
    }
  }

  const mockInfoLogger = jest.fn()
  const mockLogger = {
    info: mockInfoLogger
  }

  const appInsightsKey = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING

  beforeEach(() => {
    delete process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
    jest.clearAllMocks()
  })

  afterAll(() => {
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = appInsightsKey
  })

  test('is started when env var exists', () => {
    const appName = 'test-app'
    process.env.APPINSIGHTS_CLOUDROLE = appName
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'something'

    insights.setup(mockLogger)

    expect(setupMock).toHaveBeenCalledTimes(1)
    expect(startMock).toHaveBeenCalledTimes(1)
    expect(tags[cloudRoleTag]).toEqual(appName)
    expect(mockInfoLogger).toHaveBeenCalledTimes(1)
    expect(mockInfoLogger).toHaveBeenCalledWith('App Insights Running')
  })

  test('logs not running when env var does not exist', () => {
    insights.setup(mockLogger)

    expect(mockInfoLogger).toHaveBeenCalledTimes(1)
    expect(mockInfoLogger).toHaveBeenCalledWith('App Insights Not Running!')
  })
})
