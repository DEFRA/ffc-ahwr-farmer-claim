import { getAllClaimsForFirstHerd } from '../../../../app/lib/get-all-claims-for-first-herd.js'

describe('getAllClaimsForFirstHerd', () => {
  test('returns empty array when no previous claims for any livestock', () => {
    const typeOfLivestock = 'beef'
    const previousClaims = []

    const claimsForFirstHerd = getAllClaimsForFirstHerd(previousClaims, typeOfLivestock)

    expect(claimsForFirstHerd).toHaveLength(0)
  })

  test('returns empty array when previous claims for but not for required livestock', () => {
    const typeOfLivestock = 'beef'
    const previousClaims = [{ createdAt: '2025-04-30', data: { dateOfVisit: '2025-04-30T00:00:00.000Z', typeOfLivestock: 'sheep', herdId: undefined } }]

    const claimsForFirstHerd = getAllClaimsForFirstHerd(previousClaims, typeOfLivestock)

    expect(claimsForFirstHerd).toHaveLength(0)
  })

  test('returns one previous claim when one claim for required livestock', () => {
    const typeOfLivestock = 'beef'
    const expectedPreviousClaim = { createdAt: '2025-04-30', data: { dateOfVisit: '2025-04-30T00:00:00.000Z', typeOfLivestock: typeOfLivestock, herdId: undefined } }
    const previousClaims = [expectedPreviousClaim]

    const claimsForFirstHerd = getAllClaimsForFirstHerd(previousClaims, typeOfLivestock)

    expect(claimsForFirstHerd).toHaveLength(1)
    expect(claimsForFirstHerd[0]).toBe(expectedPreviousClaim)
  })

  test('returns one previous claim (unnamed herd) when two claims for required livestock but one for different herd', () => {
    const typeOfLivestock = 'beef'
    const expectedPreviousClaim = { createdAt: '2025-04-30', data: { dateOfVisit: '2025-04-30T00:00:00.000Z', typeOfLivestock: typeOfLivestock, herdId: undefined } }
    const previousClaims = [
      { createdAt: '2025-05-01', data: { dateOfVisit: '2025-05-01T00:00:00.000Z', typeOfLivestock: typeOfLivestock, herdId: 'fake-herd-id' } },
      expectedPreviousClaim
    ]

    const claimsForFirstHerd = getAllClaimsForFirstHerd(previousClaims, typeOfLivestock)

    expect(claimsForFirstHerd).toHaveLength(1)
    expect(claimsForFirstHerd[0]).toBe(expectedPreviousClaim)
  })

  test('returns one previous claim (named herd) when earliestClaimCanBePostMH=true and two postMH claims for required livestock but one for different herd', () => {
    const typeOfLivestock = 'beef'
    const expectedPreviousClaim = { createdAt: '2025-05-01', data: { dateOfVisit: '2025-05-01T00:00:00.000Z', typeOfLivestock: typeOfLivestock, herdId: 'fake-herd-id-1' } }
    const previousClaims = [
      { createdAt: '2025-05-01', data: { typeOfLivestock: typeOfLivestock, herdId: 'fake-herd-id-2' } },
      expectedPreviousClaim
    ]

    const claimsForFirstHerd = getAllClaimsForFirstHerd(previousClaims, typeOfLivestock, true)

    expect(claimsForFirstHerd).toHaveLength(1)
    expect(claimsForFirstHerd[0]).toBe(expectedPreviousClaim)
  })

  test('returns empty array when earliestClaimCanBePostMH=false (default) and two claims for required livestock but both postMH claims', () => {
    const typeOfLivestock = 'beef'
    const expectedPreviousClaim = { createdAt: '2025-05-01', data: { dateOfVisit: '2025-05-01T00:00:00.000Z', typeOfLivestock: typeOfLivestock, herdId: 'fake-herd-id-1' } }
    const previousClaims = [
      { createdAt: '2025-05-01', data: { typeOfLivestock: typeOfLivestock, herdId: 'fake-herd-id-2' } },
      expectedPreviousClaim
    ]

    const claimsForFirstHerd = getAllClaimsForFirstHerd(previousClaims, typeOfLivestock)

    expect(claimsForFirstHerd).toHaveLength(0)
  })

  test('returns four previous claims (named herd) when seven claims, six for required livestock but two are for different herd', () => {
    const typeOfLivestock = 'beef'
    const expectedPreviousClaim1 = { createdAt: '2024-07-01', data: { dateOfVisit: '2025-03-30T00:00:00.000Z', typeOfLivestock: typeOfLivestock, herdId: 'fake-herd-id-1' } }
    const expectedPreviousClaim2 = { createdAt: '2025-04-01', data: { dateOfVisit: '2025-04-30T00:00:00.000Z', typeOfLivestock: typeOfLivestock, herdId: 'fake-herd-id-1' } }
    const expectedPreviousClaim3 = { createdAt: '2025-05-01', data: { dateOfVisit: '2025-05-01T00:00:00.000Z', typeOfLivestock: typeOfLivestock, herdId: 'fake-herd-id-1' } }
    const expectedPreviousClaim4 = { createdAt: '2025-06-01', data: { dateOfVisit: '2025-05-30T00:00:00.000Z', typeOfLivestock: typeOfLivestock, herdId: 'fake-herd-id-1' } }
    const previousClaims = [
      expectedPreviousClaim4,
      { createdAt: '2025-05-01', data: { dateOfVisit: '2025-05-01T00:00:00.000Z', typeOfLivestock: typeOfLivestock, herdId: 'fake-herd-id-2' } },
      expectedPreviousClaim3,
      { createdAt: '2025-05-01', data: { dateOfVisit: '2025-05-01T00:00:00.000Z', typeOfLivestock: 'dairy', herdId: 'fake-herd-id-3' } },
      expectedPreviousClaim2,
      expectedPreviousClaim1
    ]

    const claimsForFirstHerd = getAllClaimsForFirstHerd(previousClaims, typeOfLivestock)

    expect(claimsForFirstHerd).toHaveLength(4)
    expect(claimsForFirstHerd).toEqual([expectedPreviousClaim4, expectedPreviousClaim3, expectedPreviousClaim2, expectedPreviousClaim1])
  })
})
