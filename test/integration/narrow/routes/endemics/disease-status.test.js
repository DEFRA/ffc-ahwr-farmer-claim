const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const { endemicsDiseaseStatus } = require('../../../../../app/config/routes')
const { getEndemicsClaim } = require('../../../../../app/session')

jest.mock('../../../../../app/session')

describe('Disease status test', () => {
  const auth = {
    credentials: {
      reference: 'AHWR-AAAA-AAAA', sbi: '111111111'
    },
    strategy: 'cookie'
  }
  const url = `/claim/${endemicsDiseaseStatus}`
  let crumb

  beforeEach(async () => {
    crumb = await getCrumbs(global.__SERVER__)
  })

  test("select '1' when diseaseStatus is '1'", async () => {
    const options = {
      method: 'GET',
      auth,
      url
    }

    getEndemicsClaim.mockReturnValue({ diseaseStatus: '1' })

    const response = await global.__SERVER__.inject(options)
    const $ = cheerio.load(response.payload)
    const diseaseStatus = '1'

    expect($('input[name="diseaseStatus"]:checked').val()).toEqual(diseaseStatus)
    expect($('.govuk-back-link').text()).toMatch('Back')
  })
  test('show inline Error if continue is pressed without diseaseStatus selected', async () => {
    const options = {
      method: 'POST',
      auth,
      url,
      headers: { cookie: `crumb=${crumb}` },
      payload: { crumb, diseaseStatus: '' }
    }

    getEndemicsClaim.mockReturnValue({})

    const response = await global.__SERVER__.inject(options)
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

    const response = await global.__SERVER__.inject(options)

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toEqual('/claim/endemics/biosecurity')
  })
})
