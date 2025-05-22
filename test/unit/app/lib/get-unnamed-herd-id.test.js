import { v4 as uuidv4 } from 'uuid'
import { setEndemicsClaim } from '../../../../app/session/index.js'
import { sessionKeys } from '../../../../app/session/keys.js'
import { getUnnamedHerdId } from '../../../../app/lib/get-unnamed-herd-id.js'

jest.mock('uuid')
jest.mock('../../../../app/session/keys.js')
jest.mock('../../../../app/session/index.js')

describe('getUnnamedHerdId', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return unnamedHerdIdFromSession if provided', () => {
    const sessionId = 'existing-session-id'
    const result = getUnnamedHerdId({}, sessionId)

    expect(result).toBe(sessionId)
    expect(uuidv4).not.toHaveBeenCalled()
    expect(setEndemicsClaim).not.toHaveBeenCalled()
  })

  it('should generate new UUID and call setEndemicsClaim if no session value', () => {
    const generatedId = '550e8400-e29b-41d4-a716-446655440000'
    uuidv4.mockReturnValueOnce(generatedId)

    const result = getUnnamedHerdId({})

    expect(uuidv4).toHaveBeenCalled()
    expect(setEndemicsClaim).toHaveBeenCalledWith(
      {},
      sessionKeys.endemicsClaim.unnamedHerdId,
      generatedId
    )
    expect(result).toBe(generatedId)
  })
})
