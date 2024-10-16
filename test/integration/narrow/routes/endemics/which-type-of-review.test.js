const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const urlPrefix = require('../../../../../app/config').urlPrefix
const { endemicsWhichTypeOfReview } = require('../../../../../app/config/routes')
const sessionMock = require('../../../../../app/session')
const setEndemicsClaimMock = require('../../../../../app/session').setEndemicsClaim
const claimServiceApiMock = require('../../../../../app/api-requests/claim-service-api')
const { setEndemicsAndOptionalPIHunt } = require('../../../../mocks/config')
jest.mock('../../../../../app/session')
jest.mock('../../../../../app/api-requests/claim-service-api')

describe('Which type of review test', () => {
  const url = `${urlPrefix}/${endemicsWhichTypeOfReview}`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  let crumb
  const previousClaims = [{ data: { typeOfLivestock: 'beef' } }]
  const latestVetVisitApplication = { data: { whichReview: 'beef' } }

  beforeAll(() => {
    setEndemicsClaimMock.mockImplementation(() => { })
    setEndemicsAndOptionalPIHunt({ endemicsEnabled: true, optionalPIHuntEnabled: false })
  })

  afterAll(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    test('Returns 200 and gets typeOfLivestock from past claim', async () => {
      sessionMock.getEndemicsClaim.mockReturnValue({ typeOfReview: 'R', latestVetVisitApplication, previousClaims: [] })
      const options = {
        method: 'GET',
        url,
        auth
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text().trim()).toMatch('What are you claiming for')
      expect($('title').text().trim()).toContain('Which type of review - Get funding to improve animal health and welfare')
      expectPhaseBanner.ok($)
    })

    test('Returns 200 and gets typeOfLivestock from past application claim', async () => {
      sessionMock.getEndemicsClaim.mockReturnValue({ typeOfReview: 'review', latestVetVisitApplication, previousClaims })
      const options = {
        method: 'GET',
        url,
        auth
      }
      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text().trim()).toMatch('What are you claiming for beef cattle?')
      expect($('title').text().trim()).toContain('Which type of review - Get funding to improve animal health and welfare')
      expectPhaseBanner.ok($)
    })

    test.each([
      { typeOfLivestock: 'beef', content: 'beef cattle' },
      { typeOfLivestock: 'dairy', content: 'dairy cattle' },
      { typeOfLivestock: 'sheep', content: 'sheep' },
      { typeOfLivestock: 'pigs', content: 'pigs' }
    ])('Returns 200 and formats content correct from typeOfLivestock $typeOfLivestock', async ({ typeOfLivestock, content }) => {
      sessionMock.getEndemicsClaim.mockReturnValue({ typeOfReview: 'review', latestVetVisitApplication: { data: { whichReview: typeOfLivestock } }, previousClaims: [] })
      const options = {
        method: 'GET',
        url,
        auth
      }
      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('h1').text().trim()).toMatch(`What are you claiming for ${content}?`)
      expect($('title').text().trim()).toContain('Which type of review - Get funding to improve animal health and welfare')
      expectPhaseBanner.ok($)
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })
  })

  describe('POST', () => {
    beforeEach(async () => {
      jest.clearAllMocks()
      crumb = await getCrumbs(global.__SERVER__)
    })

    test('Returns 400 and shows error message when payload is invalid', async () => {
      sessionMock.getEndemicsClaim.mockReturnValueOnce({ typeOfLivestock: 'beef' })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          typeOfReview: undefined
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('#main-content > div > div > div > div > div > ul > li > a').text()).toMatch('Select what you are claiming for')
    })

    test('Returns 302 and redirect to vet visit review test result', async () => {
      sessionMock.getEndemicsClaim.mockReturnValueOnce({ typeOfReview: 'endemics', typeOfLivestock: 'beef', latestVetVisitApplication, previousClaims })
      claimServiceApiMock.isFirstTimeEndemicClaimForActiveOldWorldReviewClaim.mockReturnValueOnce(true)

      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          typeOfReview: 'endemics'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/vet-visits-review-test-results')
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })

    test.each([
      { typeOfReview: 'review', nextPageUrl: '/claim/endemics/which-species', expectSetEndemicsCalls: 0 },
      { typeOfReview: 'endemics', nextPageUrl: '/claim/endemics/date-of-visit', expectSetEndemicsCalls: 1 }
    ])('Returns 302 and redirects to next page if payload is valid', async ({ typeOfReview, nextPageUrl, expectSetEndemicsCalls }) => {
      sessionMock.getEndemicsClaim.mockReturnValueOnce({ typeOfLivestock: 'beef' })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          typeOfReview
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual(nextPageUrl)
      expect(setEndemicsClaimMock).toBeCalledTimes(expectSetEndemicsCalls)
    })

    test('Returns 400 and redirects to error page for dairy follow-up when optionalPiHunt flag is false', async () => {
      sessionMock.getEndemicsClaim.mockReturnValueOnce({ typeOfLivestock: 'dairy' })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          typeOfReview: 'endemics'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expect($('h1').text().trim()).toMatch('You cannot continue with your claim')
      expectPhaseBanner.ok($)
    })

    test('Returns 302 and redirects to next page for dairy follow-up when optionalPiHunt flag is TRUE', async () => {
      setEndemicsAndOptionalPIHunt({ endemicsEnabled: true, optionalPIHuntEnabled: true })
      sessionMock.getEndemicsClaim.mockReturnValueOnce({ typeOfLivestock: 'dairy' })
      const options = {
        method: 'POST',
        url,
        auth,
        payload: {
          crumb,
          typeOfReview: 'endemics'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/claim/endemics/date-of-visit')
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })
  })
})
