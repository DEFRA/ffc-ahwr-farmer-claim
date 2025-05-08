import cheerio from 'cheerio'
import { createServer } from '../../../../../app/server.js'
import links from '../../../../../app/config/routes.js'
import { getCrumbs } from '../../../../utils/get-crumbs.js'
import { getEndemicsClaim } from '../../../../../app/session/index.js'

const { endemicsDiseaseStatus } = links

jest.mock('../../../../../app/session')

describe('Disease status test', () => {
  const url = `/claim/${endemicsDiseaseStatus}`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  let crumb

  beforeEach(async () => {
    crumb = await getCrumbs(server)
  })

  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })
  afterAll(async () => {
    await server.stop()
    jest.resetAllMocks()
  })

  describe(`GET ${url}`, () => {
    test('redirect if not logged in / authorized', async () => {
      const options = {
        method: 'GET',
        url
      }

      const response = await server.inject(options)

      expect(response.statusCode).toBe(302)
      expect(response.headers.location.toString()).toEqual(expect.stringContaining('oauth2/v2.0/authorize'))
    })

    test('Returns 200', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }
      getEndemicsClaim.mockReturnValue({ reference: 'TEMP-6GSE-PIR8' })

      const response = await server.inject(options)

      expect(response.statusCode).toBe(200)
    })

    test('display question text', async () => {
      const options = {
        method: 'GET',
        url,
        auth
      }
      getEndemicsClaim.mockReturnValue({ reference: 'TEMP-6GSE-PIR8' })

      const response = await server.inject(options)

      const $ = cheerio.load(response.payload)
      expect($('h1').text()).toMatch('What is the disease status category?')
    })

    test("select '1' when diseaseStatus is '1'", async () => {
      const options = {
        method: 'GET',
        auth,
        url
      }

      getEndemicsClaim.mockReturnValue({ diseaseStatus: '1', reference: 'TEMP-6GSE-PIR8' })

      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)
      const diseaseStatus = '1'

      expect($('input[name="diseaseStatus"]:checked').val()).toEqual(diseaseStatus)
      expect($('.govuk-back-link').text()).toMatch('Back')
    })
  })

  describe(`POST ${url}`, () => {
    test('show inline Error if continue is pressed without diseaseStatus selected', async () => {
      const options = {
        method: 'POST',
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` },
        payload: { crumb, diseaseStatus: '' }
      }

      getEndemicsClaim.mockReturnValue({})

      const response = await server.inject(options)
      const $ = cheerio.load(response.payload)
      const errorMessage = 'Enter the disease status category'

      expect($('p.govuk-error-message').text()).toMatch(errorMessage)
    })

    test('continue when diseaseStatus category is selected', async () => {
      const options = {
        method: 'POST',
        auth,
        url,
        headers: { cookie: `crumb=${crumb}` },
        payload: { crumb, diseaseStatus: '1' }
      }
      getEndemicsClaim.mockReturnValue({ diseaseStatus: '1' })

      const response = await server.inject(options)

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toEqual('/claim/endemics/biosecurity')
    })
  })
})
