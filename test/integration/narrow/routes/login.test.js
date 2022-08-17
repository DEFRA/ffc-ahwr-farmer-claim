const cheerio = require('cheerio')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')

describe('Farmer claim login page test', () => {
  const org = { name: 'my-org' }
  const claimWithVisit = { vetVisit: {} }
  const url = '/login'

  const application = require('../../../../app/messaging/application')
  jest.mock('../../../../app/messaging/application')
  jest.mock('../../../../app/session')
  const orgs = require('../../../../app/api-requests/users')
  jest.mock('../../../../app/api-requests/users')

  beforeEach(() => {
    jest.resetAllMocks()
    application.getClaim.mockResolvedValue(claimWithVisit)
    orgs.getByEmail.mockResolvedValue(org)
  })

  describe(`GET requests to '${url}'`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPhaseBanner.ok($)
    })
  })
})
