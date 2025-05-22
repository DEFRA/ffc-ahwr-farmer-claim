import * as contextHelper from '../../../../app/lib/context-helper.js'
import { config } from '../../../../app/config/index.js'
import { getHerdBackLink } from '../../../../app/lib/get-herd-back-link'
import links from '../../../../app/config/routes.js'

jest.mock('../../../../app/lib/context-helper.js', () => ({
  skipSameHerdPage: jest.fn()
}))

describe('getHerdBackLink', () => {
  const typeOfLivestock = 'cattle'
  const previousClaims = [{ claimId: 1 }]

  const { urlPrefix } = config
  const { endemicsCheckHerdDetails, endemicsSameHerd } = links

  it('should return CheckHerdDetails link if skipSameHerdPage returns true', () => {
    contextHelper.skipSameHerdPage.mockReturnValue(true)

    const result = getHerdBackLink(typeOfLivestock, previousClaims)

    expect(result).toBe(`${urlPrefix}/${endemicsCheckHerdDetails}`)
  })

  it('should return SameHerd link if skipSameHerdPage returns false', () => {
    contextHelper.skipSameHerdPage.mockReturnValue(false)

    const result = getHerdBackLink(typeOfLivestock, previousClaims)

    expect(result).toBe(`${urlPrefix}/${endemicsSameHerd}`)
  })
})
