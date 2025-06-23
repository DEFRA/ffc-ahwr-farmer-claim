import { getAllClaimsForFirstHerd } from '../../../../app/lib/get-all-claims-for-first-herd.js'

describe('getAllClaimsForFirstHerd', () => {
  test('returns empty array when no previous claims for any livestock', () => {
    const previousClaims = 'beef'
    const typeOfLivestock = []

    const claimsForFirstHerd = getAllClaimsForFirstHerd(typeOfLivestock, previousClaims)

    expect(claimsForFirstHerd).toHaveLength(0)
  })

  test('returns empty array when previous claims for but not for required livestock', () => {
    const previousClaims = 'beef'
    const typeOfLivestock = [{ createdAt: '2025-04-30', data: { typeOfLivestock: 'sheep', herdId: undefined } }]

    const claimsForFirstHerd = getAllClaimsForFirstHerd(typeOfLivestock, previousClaims)

    expect(claimsForFirstHerd).toHaveLength(0)
  })

  test('returns one previous claim when one claim for required livestock', () => {
    const previousClaims = 'beef'
    const typeOfLivestock = [{ createdAt: '2025-04-30', data: { typeOfLivestock: previousClaims, herdId: undefined } }]

    const claimsForFirstHerd = getAllClaimsForFirstHerd(typeOfLivestock, previousClaims)

    expect(claimsForFirstHerd).toHaveLength(1)
  })

  test('returns one previous claim (unnamed herd) when two claims for required livestock but one for different herd', () => {
    const previousClaims = 'beef'
    const expectedPreviousClaim = { createdAt: '2025-04-30', data: { typeOfLivestock: previousClaims, herdId: undefined } }
    const typeOfLivestock = [
      { createdAt: '2025-05-01', data: { typeOfLivestock: previousClaims, herdId: 'fake-herd-id' } },
      expectedPreviousClaim
    ]

    const claimsForFirstHerd = getAllClaimsForFirstHerd(typeOfLivestock, previousClaims)

    expect(claimsForFirstHerd).toHaveLength(1)
    expect(claimsForFirstHerd[0]).toBe(expectedPreviousClaim)
  })

  test('returns one previous claim (named herd) when two claims for required livestock but one for different herd', () => {
    const previousClaims = 'beef'
    const expectedPreviousClaim = { createdAt: '2025-04-30', data: { typeOfLivestock: previousClaims, herdId: 'fake-herd-id-1' } }
    const typeOfLivestock = [
      { createdAt: '2025-05-01', data: { typeOfLivestock: previousClaims, herdId: 'fake-herd-id-2' } },
      expectedPreviousClaim
    ]

    const claimsForFirstHerd = getAllClaimsForFirstHerd(typeOfLivestock, previousClaims)

    expect(claimsForFirstHerd).toHaveLength(1)
    expect(claimsForFirstHerd[0]).toBe(expectedPreviousClaim)
  })

  test('returns four previous claims (named herd) when seven claims, six for required livestock but two are for different herd', () => {
    const previousClaims = 'beef'
    const expectedPreviousClaim1 = { createdAt: '2025-03-30', data: { typeOfLivestock: previousClaims, herdId: 'fake-herd-id-1' } }
    const expectedPreviousClaim2 = { createdAt: '2025-04-30', data: { typeOfLivestock: previousClaims, herdId: 'fake-herd-id-1' } }
    const expectedPreviousClaim3 = { createdAt: '2025-05-01', data: { typeOfLivestock: previousClaims, herdId: 'fake-herd-id-1' } }
    const expectedPreviousClaim4 = { createdAt: '2025-05-30', data: { typeOfLivestock: previousClaims, herdId: 'fake-herd-id-1' } }
    const typeOfLivestock = [
      expectedPreviousClaim4,
      { createdAt: '2025-05-01', data: { typeOfLivestock: previousClaims, herdId: 'fake-herd-id-2' } },
      expectedPreviousClaim3,
      { createdAt: '2025-05-01', data: { typeOfLivestock: 'dairy', herdId: 'fake-herd-id-3' } },
      expectedPreviousClaim2,
      expectedPreviousClaim1
    ]

    const claimsForFirstHerd = getAllClaimsForFirstHerd(typeOfLivestock, previousClaims)

    expect(claimsForFirstHerd).toHaveLength(4)
    expect(claimsForFirstHerd).toEqual([expectedPreviousClaim4, expectedPreviousClaim3, expectedPreviousClaim2, expectedPreviousClaim1])
  })
})
