const { claimDashboard } = require('../../../../app/config/routes')
const { redirectReferenceMissing } = require('../../../../app/lib/redirect-reference-missing')
const { getEndemicsClaim } = require('../../../../app/session')

jest.mock('../../../../app/session')

describe('redirectReferenceMissing', () => {
  let h

  beforeEach(() => {
    h = {
      redirect: jest.fn().mockReturnThis(),
      takeover: jest.fn(),
      continue: Symbol('continue')
    }
  })

  test('should redirect to dashboard when claim reference is missing', () => {
    getEndemicsClaim.mockReturnValueOnce({})

    redirectReferenceMissing({}, h)

    expect(h.redirect).toHaveBeenCalledWith(claimDashboard)
    expect(h.takeover).toHaveBeenCalled()
  })

  test('should continue when claim reference exists', async () => {
    getEndemicsClaim.mockReturnValueOnce({ reference: 'some-ref' })

    const result = await redirectReferenceMissing({}, h)

    expect(result).toBe(h.continue)
    expect(h.redirect).not.toHaveBeenCalled()
    expect(h.takeover).not.toHaveBeenCalled()
  })
})
