const cheerio = require('cheerio')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')

describe('no-business-available-to-claim-for page test', () => {
  let url
  const serviceName = 'Annual health and welfare review of livestock'
  beforeAll(async () => {
    jest.resetAllMocks()
    jest.resetModules()
    jest.mock('ffc-ahwr-event-publisher')
    jest.mock('../../../../app/config', () => ({
      ...jest.requireActual('../../../../app/config'),
      serviceName: 'Annual health and welfare review of livestock',
      authConfig: {
        defraId: {
          enabled: false
        }
      }
    }))
    require('../../../../app/config')
    url = '/claim/no-business-available-to-claim-for'
  })

  describe(`GET ${url} route`, () => {
    test('when logged in returns 200', async () => {
      const options = {
        auth: { credentials: { reference: '1111', sbi: '111111111' }, strategy: 'cookie' },
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toEqual('No business available to claim for')
      expect($('title').text()).toEqual(`No business available to claim for - ${serviceName}`)
      expectPhaseBanner.ok($)
    })
  })
})
