const cheerio = require('cheerio')
const expectPhaseBanner = require('../../../../utils/phase-banner-expect')
const urlPrefix = require('../../../../../app/config').urlPrefix
const contextHelperMock = require('../../../../../app/lib/context-helper')
const { setMultiSpecies } = require('../../../../mocks/config')
const createServer = require('../../../../../app/server')

jest.mock('../../../../../app/lib/logout')
jest.mock('../../../../../app/lib/context-helper')

describe('Claim endemics home page test', () => {
  const url = `${urlPrefix}/endemics?from=dashboard&sbi=1234567`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }

  let server

  beforeAll(async () => {
    setMultiSpecies(false)
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('Redirects us to endemicsWhichTypeOfReviewURI if latest VV application is within 10 months', async () => {
    contextHelperMock.refreshApplications.mockReturnValue({
      latestEndemicsApplication: {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      },
      latestVetVisitApplication: {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 9,
        type: 'VV'
      }
    })
    contextHelperMock.refreshClaims.mockReturnValue([])

    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/which-type-of-review')
  })

  test('Redirects us to endemicsWhichSpeciesURI if latest VV application is NOT within 10 months', async () => {
    contextHelperMock.refreshApplications.mockReturnValue({
      latestEndemicsApplication: {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      },
      latestVetVisitApplication: undefined
    })

    contextHelperMock.refreshClaims.mockReturnValue([])

    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/which-species')
  })

  test('Redirects to endemicsWhichTypeOfReviewURI if EE claim is already made', async () => {
    contextHelperMock.refreshApplications.mockReturnValue({
      latestEndemicsApplication: {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      },
      latestVetVisitApplication: undefined
    })

    contextHelperMock.refreshClaims.mockReturnValue([
      {
        info: 'some claim'
      }
    ])

    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/which-type-of-review')
  })

  test('Renders index page if no url parameters', async () => {
    const options = {
      method: 'GET',
      url: `${urlPrefix}/endemics`,
      auth
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('h1').text().trim()).toMatch('Claim funding to improve animal health and welfare')
    expect($('title').text().trim()).toContain('Claim funding - Get funding to improve animal health and welfare')
    expectPhaseBanner.ok($)
  })

  test('Redirects us to endemicsWhichSpeciesURI if multiple species enabled', async () => {
    jest.mock('../../../../../app/config', () => ({
      ...jest.requireActual('../../../../../app/config'),
      multiSpecies: {
        enabled: true
      }
    }))
    contextHelperMock.refreshApplications.mockReturnValue({
      latestEndemicsApplication: {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      }
    })
    contextHelperMock.refreshClaims.mockReturnValue([])

    const options = {
      method: 'GET',
      url,
      auth
    }

    const res = await server.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/which-species')
  })
})
