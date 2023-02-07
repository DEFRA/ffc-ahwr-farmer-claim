const cheerio = require('cheerio')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')

describe('No Eligible Businesses page test', () => {
  let url
  const serviceName = 'Annual health and welfare review of livestock'
  beforeAll(async () => {
    jest.resetAllMocks()
    jest.resetModules()
    jest.mock('ffc-ahwr-event-publisher')
    jest.mock('../../../../app/config', () => ({
      ...jest.requireActual('../../../../app/config'),
      serviceName: 'Annual health and welfare review of livestock',
      selectYourBusiness: {
        enabled: true
      }
    }))
    require('../../../../app/config')
    url = '/claim/no-claimable-businesses'
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
      expect($('.govuk-heading-l').text()).toEqual('No Eligible Businesses')
      expect($('title').text()).toEqual(`No Eligible Businesses - ${serviceName}`)
      expectPhaseBanner.ok($)
    })
  })
})
