const cheerio = require('cheerio')
const getCrumbs = require('../../../../utils/get-crumbs')
const { endemicsWhichSpecies } = require('../../../../../app/config/routes')
const { getEndemicsClaim } = require('../../../../../app/session')
const setEndemicsClaimMock = require('../../../../../app/session').setEndemicsClaim

jest.mock('../../../../../app/session')
describe('Endemics which species test', () => {
  setEndemicsClaimMock.mockImplementation(() => { })
  jest.mock('../../../../../app/config', () => {
    const originalModule = jest.requireActual('../../../../../app/config')
    return {
      ...originalModule,
      endemics: {
        enabled: true
      },
      multiSpecies: {
        enabled: true
      }
    }
  })
  const url = `/claim/${endemicsWhichSpecies}`
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  let crumb

  beforeEach(async () => {
    crumb = await getCrumbs(global.__SERVER__)
  })

  describe('GET claim/endemics/which-species', () => {
    test('should render page when no previous session exists', async () => {
      const options = {
        method: 'GET',
        auth,
        url
      }

      const res = await global.__SERVER__.inject(options)
      const $ = cheerio.load(res.payload)

      expect(res.statusCode).toBe(200)
      expect($('title').text().trim()).toContain('Which species are you claiming for? - Get funding to improve animal health and welfare - GOV.UK')
      expect($('h1').text().trim()).toMatch('Which species are you claiming for?')
      expect($('.govuk-radios__item').length).toEqual(4)
      expect($('.govuk-back-link').attr('href')).toContain('vet-visits')
    })
  })

  test.each([
    { typeOfLivestock: 'beef', radio: 'Beef cattle' },
    { typeOfLivestock: 'dairy', radio: 'Dairy cattle' },
    { typeOfLivestock: 'pigs', radio: 'Pigs' },
    { typeOfLivestock: 'sheep', radio: 'Sheep' }
  ])('should select $radio when previous session livestock is $typeOfLivestock', async ({ typeOfLivestock, radio }) => {
    const options = {
      method: 'GET',
      auth,
      url
    }

    getEndemicsClaim.mockReturnValue({ typeOfLivestock })

    const res = await global.__SERVER__.inject(options)

    const $ = cheerio.load(res.payload)
    expect($('input[name="typeOfLivestock"]:checked').next('label').text().trim()).toEqual(radio)
    expect($('.govuk-back-link').text()).toMatch('Back')
  })

  describe('POST claim/endemics/which-species', () => {
    test('should display error when livestock not selected', async () => {
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
      expect($('p.govuk-error-message').text()).toMatch('Select which species you are claiming for')
      expect(res.statusCode).toBe(400)
    })

    test('should redirect to next page when livestock selected', async () => {
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
      expect(setEndemicsClaimMock).toHaveBeenCalled()
    })
  })
})
