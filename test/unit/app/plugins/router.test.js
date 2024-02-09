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
      '/claim/animals-tested',
      '/claim/check-answers',
      '/claim/cookies',
      '/claim/details-incorrect',
      '/claim/endemics',
      '/claim/number-of-animals-ineligible',
      '/claim/signin-oidc',
      '/claim/submit-claim',
      '/claim/urn-result',
      '/claim/vet-name',
      '/claim/vet-rcvs',
      '/claim/vet-visit-date',
      '/claim/visit-review',
      '/claim/assets/{path*}',
      '/claim/endemics/date-of-visit',
      '/claim/endemics/number-of-fluid-oral-samples',
      '/claim/endemics/number-of-species-tested',
      '/claim/endemics/species-numbers',
      '/claim/endemics/test-results',
      '/claim/endemics/test-urn',
      '/claim/endemics/vet-name',
      '/claim/endemics/vet-rcvs',
      '/claim/endemics/which-review-annual',
      '/claim/endemics/which-type-of-review',
      '/claim/endemics/you-cannot-claim',
      '/claim/animals-tested',
      '/claim/cookies',
      '/claim/submit-claim',
      '/claim/urn-result',
      '/claim/vet-name',
      '/claim/vet-rcvs',
      '/claim/vet-visit-date',
      '/claim/visit-review',
      '/claim/endemics/number-of-fluid-oral-samples',
      '/claim/endemics/number-of-species-tested',
      '/claim/endemics/species-numbers',
      '/claim/endemics/test-results',
      '/claim/endemics/test-urn',
      '/claim/endemics/vet-name',
      '/claim/endemics/vet-rcvs',
      '/claim/endemics/which-review-annual'
    ])
  })
})
