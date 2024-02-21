const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const { endemicsWhichSpecies } = require('../../../../../app/config/routes')
const { getEndemicsClaim } = require('../../../../../app/session')

jest.mock('../../../../../app/session')
describe('Endemics which species test', () => {
  const url = `/claim/${endemicsWhichSpecies}`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  let crumb

  beforeEach(async () => {
    crumb = await getCrumbs(global.__SERVER__)
  })

  test('Sheep should be selected when typeOfLivestock is sheep', async () => {
    const options = {
      method: 'GET',
      auth,
      url
    }

    getEndemicsClaim.mockReturnValue({ typeOfLivestock: 'sheep' })

    const res = await global.__SERVER__.inject(options)
    const $ = cheerio.load(res.payload)
    const typeOfLivestock = 'sheep'

    expect($('input[name="typeOfLivestock"]:checked').val()).toEqual(typeOfLivestock)
    expect($('.govuk-back-link').text()).toMatch('Back')
  })
  test('Continue without seleceted livestock should return error', async () => {
    const options = {
      method: 'POST',
      auth,
      url,
      headers: { cookie: `crumb=${crumb}` },
      payload: { crumb, typeOfLivestock: '' }
    }

    getEndemicsClaim.mockReturnValue({})

    const res = await global.__SERVER__.inject(options)
    const $ = cheerio.load(res.payload)
    const errorMessage = 'Select which livestock you are claiming for'

    expect($('p.govuk-error-message').text()).toMatch(errorMessage)
  })
  test('Continue with Sheep seleceted as a livestock', async () => {
    const options = {
      method: 'POST',
      auth,
      url,
      headers: { cookie: `crumb=${crumb}` },
      payload: { crumb, typeOfLivestock: 'sheep' }
    }

    getEndemicsClaim.mockReturnValue({ typeOfLivestock: 'sheep' })

    const res = await global.__SERVER__.inject(options)

    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toEqual('/claim/endemics/date-of-visit')
  })
})
