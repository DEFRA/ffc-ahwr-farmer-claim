import { createServer } from '../../../../app/server.js'

jest.mock('../../../../app/config')

describe('routes plugin test', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test('routes included', async () => {
    const server = await createServer()
    const routePaths = new Set()
    server.table()
      .forEach((element) => {
        routePaths.add(element.path)
      })
    const registeredRoutes = Array.from(routePaths.values()).sort()
    const expectedRoutes = [
      '/healthy',
      '/healthz',
      '/claim/cookies',
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
      '/claim/endemics/select-the-herd',
      '/claim/endemics/enter-herd-name',
      '/claim/endemics/enter-cph-number',
      '/claim/endemics/herd-others-on-sbi',
      '/claim/endemics/enter-herd-details',
      '/claim/endemics/check-herd-details',
      '/claim/endemics/same-herd',
      '/claim/endemics/pigs-elisa-result',
      '/claim/endemics/pigs-pcr-result',
      '/claim/endemics/pigs-genetic-sequencing',
      '/{any*}'
    ].sort()
    expect(registeredRoutes).toEqual(expectedRoutes)
  })
})
