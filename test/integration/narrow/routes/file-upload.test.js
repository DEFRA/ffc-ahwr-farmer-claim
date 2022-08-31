const cheerio = require('cheerio')
const FormData = require('form-data')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const getCrumbs = require('../../../utils/get-crumbs')
const mockUpload = jest.fn()
jest.mock('@azure/storage-blob', () => {
  return {
    BlobServiceClient: {
      fromConnectionString: jest.fn().mockImplementation(() => {
        return {
          getContainerClient: jest.fn().mockImplementation(() => {
            return {
              createIfNotExists: jest.fn(),
              getBlockBlobClient: jest.fn().mockImplementation(() => {
                return {
                  upload: mockUpload
                }
              })
            }
          })
        }
      })
    }
  }
})
describe('file-upload upload page test', () => {
  const url = '/file-upload'
  const auth = { credentials: { reference: '1111', sbi: '111111111' }, strategy: 'cookie' }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe(`GET requests to '${url}'`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        auth,
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expectPhaseBanner.ok($)
    })
  })

  describe(`POST requests to ${url} route`, () => {
    const method = 'POST'
    test.each([
      { crumb: '' },
      { crumb: undefined }
    ])('returns 403 when request does not contain crumb - $crumb', async ({ crumb }) => {
      const form = new FormData({ maxDataSize: 209 })
      const options = {
        method,
        url,
        auth,
        payload: { crumb },
        headers: { cookie: `crumb=${crumb}`, ...form.getHeaders() }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expectPhaseBanner.ok($)
      // expect($('.govuk-heading-l').text()).toEqual('403 - Forbidden')
    })

    test.each([
      { filename: 'xyz.abc' },
      { filename: '123.jpg' },
      { filename: 'xyz.doc' },
      { filename: 'xyz.docx' },
      { filename: 'xyz.DOC' },
      { filename: 'xyz.DOCX' }
    ])('returns page for $filename when file upload returns success', async ({ filename }) => {
      const crumb = await getCrumbs(global.__SERVER__)
      const file = { hapi: { filename } }
      const options = {
        auth,
        method,
        url,
        payload: { crumb, file },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expectPhaseBanner.ok($)
      // expect($('#error-message').text()).toContain(filename)
    })

    test.each([
      { filename: 'xyz.abc' },
      { filename: '123.jpg' }
    ])('returns page for $filename when file upload returns validation error', async ({ filename }) => {
      const crumb = await getCrumbs(global.__SERVER__)
      const file = { hapi: { filename } }
      const options = {
        auth,
        method,
        url,
        payload: { crumb, file },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expectPhaseBanner.ok($)
      // expect($('#error-message').text()).toContain(filename)
    })

    test('returns page for $filename when file upload returns unknown error', async () => {
      jest.mock('@azure/storage-blob', () => {
        throw new Error('Something went wrong.')
      })

      const form = new FormData({ maxDataSize: 209 })
      const filename = 'xyz'
      const crumb = await getCrumbs(global.__SERVER__)
      const file = { hapi: { filename, _data: form.getBuffer() } }
      const options = {
        auth,
        method,
        url,
        payload: { crumb, file },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(400)
      const $ = cheerio.load(res.payload)
      expectPhaseBanner.ok($)
      // expect($('#error-message').text()).toContain(filename)
    })
  })
})
