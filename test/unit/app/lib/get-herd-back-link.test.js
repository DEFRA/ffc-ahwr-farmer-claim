import * as contextHelper from '../../../../app/lib/context-helper.js'
import { getHerdBackLink } from '../../../../app/lib/get-herd-back-link'

jest.mock('../../../../app/lib/context-helper.js', () => ({
  skipSameHerdPage: jest.fn()
}))

describe('getHerdBackLink', () => {
  it('should return CheckHerdDetails link if skipSameHerdPage returns true', () => {
    contextHelper.skipSameHerdPage.mockReturnValue(true)

    const result = getHerdBackLink('cattle', [{ claimId: 1 }])

    expect(result).toBe('/claim/endemics/check-herd-details')
  })

  it('should return SameHerd link if skipSameHerdPage returns false', () => {
    contextHelper.skipSameHerdPage.mockReturnValue(false)

    const result = getHerdBackLink('cattle', [{ claimId: 1 }])

    expect(result).toBe('/claim/endemics/same-herd')
  })
})
