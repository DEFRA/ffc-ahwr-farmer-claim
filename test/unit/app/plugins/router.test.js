describe('routes plugin test', () => {
  jest.mock('../../../../app/config', () => ({
    ...jest.requireActual('../../../../app/config'),
    endemics: {
      enabled: false
    }
  }))

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test('routes included', async () => {
    const createServer = require('../../../../app/server')
    const server = await createServer()
    const routePaths = []
    server.table().forEach((element) => {
      routePaths.push(element.path)
    })
    expect(routePaths).toEqual([
      '/claim',
      '/healthy',
      '/healthz',
      '/claim/cookies',
      '/claim/signin-oidc',
      '/claim/assets/{path*}',
      '/claim/cookies'
    ])
  })

  test('routes included - endemics enabled', async () => {
    jest.mock('../../../../app/config', () => ({
      ...jest.requireActual('../../../../app/config'),
      endemics: {
        enabled: true
      }
    }))

    const createServer = require('../../../../app/server')
    const server = await createServer()
    const routePaths = []
    server.table().forEach((element) => {
      routePaths.push(element.path)
    })
    expect(routePaths).toEqual([
      '/claim',
      '/healthy',
      '/healthz',
      '/claim/cookies',
      '/claim/endemics',
      '/claim/signin-oidc',
      '/claim/assets/{path*}',
      '/claim/endemics/biosecurity',
      '/claim/endemics/check-answers',
      '/claim/endemics/confirmation',
      '/claim/endemics/date-of-testing',
      '/claim/endemics/date-of-visit',
      '/claim/endemics/disease-status',
      '/claim/endemics/number-of-fluid-oral-samples',
      '/claim/endemics/number-of-samples-tested',
      '/claim/endemics/number-of-species-tested',
      '/claim/endemics/pi-hunt',
      '/claim/endemics/pi-hunt-all-animals',
      '/claim/endemics/pi-hunt-recommended',
      '/claim/endemics/sheep-endemics-package',
      '/claim/endemics/sheep-test-results',
      '/claim/endemics/sheep-tests',
      '/claim/endemics/species-numbers',
      '/claim/endemics/test-results',
      '/claim/endemics/test-urn',
      '/claim/endemics/vaccination',
      '/claim/endemics/vet-name',
      '/claim/endemics/vet-rcvs',
      '/claim/endemics/vet-visits-review-test-results',
      '/claim/endemics/which-species',
      '/claim/endemics/which-type-of-review',
      '/claim/cookies',
      '/claim/endemics/biosecurity',
      '/claim/endemics/check-answers',
      '/claim/endemics/date-of-testing',
      '/claim/endemics/date-of-visit',
      '/claim/endemics/disease-status',
      '/claim/endemics/number-of-fluid-oral-samples',
      '/claim/endemics/number-of-samples-tested',
      '/claim/endemics/number-of-species-tested',
      '/claim/endemics/pi-hunt',
      '/claim/endemics/pi-hunt-all-animals',
      '/claim/endemics/pi-hunt-recommended',
      '/claim/endemics/sheep-endemics-package',
      '/claim/endemics/sheep-test-results',
      '/claim/endemics/sheep-tests',
      '/claim/endemics/species-numbers',
      '/claim/endemics/test-results',
      '/claim/endemics/test-urn',
      '/claim/endemics/vaccination',
      '/claim/endemics/vet-name',
      '/claim/endemics/vet-rcvs',
      '/claim/endemics/vet-visits-review-test-results',
      '/claim/endemics/which-species',
      '/claim/endemics/which-type-of-review'
    ])
  })

  test('when isDev is true, dev-sign-in included in routes', async () => {
    jest.mock('../../../../app/config', () => ({
      ...jest.requireActual('../../../../app/config'),
      devLogin: {
        enabled: true
      }
    }))

    const createServer = require('../../../../app/server')
    const server = await createServer()
    const routePaths = []
    server.table().forEach((element) => {
      routePaths.push(element.path)
    })

    expect(routePaths).toContain('/claim/endemics/dev-sign-in')
  })
})
