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

  const expectedRoutePaths = [
    '/claim',
    '/healthy',
    '/healthz',
    '/claim/animals-tested',
    '/claim/check-answers',
    '/claim/cookies',
    '/claim/details-incorrect',
    '/claim/number-of-animals-ineligible',
    '/claim/signin-oidc',
    '/claim/submit-claim',
    '/claim/urn-result',
    '/claim/vet-name',
    '/claim/vet-rcvs',
    '/claim/vet-visit-date',
    '/claim/visit-review',
    '/claim/assets/{path*}',
    '/claim/animals-tested',
    '/claim/cookies',
    '/claim/submit-claim',
    '/claim/urn-result',
    '/claim/vet-name',
    '/claim/vet-rcvs',
    '/claim/vet-visit-date',
    '/claim/visit-review'
  ]

  const expectedRoutePathsWithEndemics = [
    ...expectedRoutePaths,
    '/claim/endemics',
    '/claim/endemics/biosecurity',
    '/claim/endemics/check-answers',
    '/claim/endemics/confirmation',
    '/claim/endemics/date-of-testing',
    '/claim/endemics/date-of-visit',
    '/claim/endemics/number-of-fluid-oral-samples',
    '/claim/endemics/number-of-species-tested',
    '/claim/endemics/species-numbers',
    '/claim/endemics/test-results',
    '/claim/endemics/test-urn',
    '/claim/endemics/vaccination',
    '/claim/endemics/vet-name',
    '/claim/endemics/vet-rcvs',
    '/claim/endemics/which-species',
    '/claim/endemics/which-type-of-review',
    '/claim/endemics/you-cannot-claim'
  ]

  test('routes included', async () => {
    const createServer = require('../../../../app/server')
    const server = await createServer()
    const routePaths = []
    server.table().forEach((element) => {
      routePaths.push(element.path)
    })
    expect(routePaths).toEqual(expectedRoutePaths)
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
    expect(routePaths).toEqual(expectedRoutePathsWithEndemics)
  })
})
