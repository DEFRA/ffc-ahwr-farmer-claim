import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { config } from '../../../../../app/config/index.js'
import { setMultiSpecies } from '../../../../mocks/config.js'
import { refreshApplications, resetEndemicsClaimSession } from '../../../../../app/lib/context-helper.js'
import expectPhaseBanner from 'assert'

const urlPrefix = config.urlPrefix

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
    refreshApplications.mockReturnValue({
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
    resetEndemicsClaimSession.mockReturnValue([])

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
    refreshApplications.mockReturnValue({
      latestEndemicsApplication: {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      },
      latestVetVisitApplication: undefined
    })

    resetEndemicsClaimSession.mockReturnValue([])

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
    refreshApplications.mockReturnValue({
      latestEndemicsApplication: {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      },
      latestVetVisitApplication: undefined
    })

    resetEndemicsClaimSession.mockReturnValue([
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
    refreshApplications.mockReturnValue({
      latestEndemicsApplication: {
        reference: 'AHWR-2470-6BA9',
        createdAt: Date.now(),
        statusId: 1,
        type: 'EE'
      }
    })
    resetEndemicsClaimSession.mockReturnValue([])

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
