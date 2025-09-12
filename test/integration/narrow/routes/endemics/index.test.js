import * as cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import { config } from '../../../../../app/config/index.js'
import { refreshApplications, resetEndemicsClaimSession } from '../../../../../app/lib/context-helper.js'
import expectPhaseBanner from 'assert'
import { getEndemicsClaim, setEndemicsClaim } from '../../../../../app/session/index.js'
import { logout } from '../../../../../app/lib/logout.js'

const urlPrefix = config.urlPrefix

jest.mock('../../../../../app/lib/logout')
jest.mock('../../../../../app/lib/context-helper')
jest.mock('../../../../../app/session/index')

describe('Claim endemics home page test', () => {
  const url = `${urlPrefix}/endemics`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }

  let server

  beforeAll(async () => {
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

  test('Redirects to endemicsWhichSpeciesURI if organisation found in session', async () => {
    getEndemicsClaim.mockReturnValue({ organisation: { sbi: '111111111' } })
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

    expect(resetEndemicsClaimSession).toHaveBeenCalled()
    expect(setEndemicsClaim).toHaveBeenCalledWith(expect.any(Object), 'landingPage', '/claim/endemics/which-species')
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/which-species')
  })

  test('Ensures logout called and then renders index page if no organisation found in session', async () => {
    getEndemicsClaim.mockReturnValue(null)
    const options = {
      method: 'GET',
      url: `${urlPrefix}/endemics`,
      auth
    }

    const res = await server.inject(options)

    expect(logout).toHaveBeenCalled()

    expect(res.statusCode).toBe(200)
    const $ = cheerio.load(res.payload)
    expect($('h1').text().trim()).toMatch('Claim funding to improve animal health and welfare')
    expect($('title').text().trim()).toContain('Claim funding - Get funding to improve animal health and welfare')
    expectPhaseBanner.ok($)
  })
})
