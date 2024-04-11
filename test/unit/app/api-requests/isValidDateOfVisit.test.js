const { isValidDateOfVisit } = require('../../../../app/api-requests/claim-service-api')

const generateMockPreviousClaim = (data, type = 'R', statusId = 9) => {
  return data.map((d) => (
    {
      data: { dateOfVisit: d },
      type,
      statusId
    }
  ))
}

const generateMockVetVisitReview = (date, statusId = 9) => {
  return {
    data: { visitDate: date },
    statusId
  }
}

describe('isValidDateOfVisit test', () => {
  describe('REVIEW', () => {
    test.each([
      {
        test: 'vetVisitReview within last 10 months, no previous claims',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: undefined,
        expected: { isValid: false, reason: 'another review within 10 months' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, no previous claims',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: undefined,
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous claims - 1 within 10 months, 0 future 2 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2024-05-01']),
        expected: { isValid: false, reason: 'another review within 10 months' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2024-12-01']),
        expected: { isValid: false, reason: 'another review within 10 months' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous claims - 1 within 10 months, 2 future 0 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: generateMockPreviousClaim(['2024-12-01', '2025-12-01']),
        expected: { isValid: false, reason: 'another review within 10 months' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous claims - 0 within 10 months, 0 future 2 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2023-12-01']),
        expected: { isValid: false, reason: 'another review within 10 months' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2025-12-01']),
        expected: { isValid: false, reason: 'another review within 10 months' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous claims - 0 within 10 months, 2 future 0 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: generateMockPreviousClaim(['2026-11-01', '2027-12-01']),
        expected: { isValid: false, reason: 'another review within 10 months' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous claims - 1 within 10 months, 0 future 2 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2024-05-01']),
        expected: { isValid: false, reason: 'another review within 10 months' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2024-12-01']),
        expected: { isValid: false, reason: 'another review within 10 months' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous claims - 1 within 10 months, 2 future 0 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2024-12-01', '2025-12-01']),
        expected: { isValid: false, reason: 'another review within 10 months' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous claims - 0 within 10 months, 0 future 2 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2023-12-01']),
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2025-12-01']),
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous claims - 0 within 10 months, 2 future 0 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2025-12-01', '2026-12-01']),
        expected: { isValid: true }
      },
      {
        test: 'no vetVisitReview, 2 previous claims - 1 within 10 months, 0 future 2 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2024-05-01']),
        expected: { isValid: false, reason: 'another review within 10 months' }
      },
      {
        test: 'no vetVisitReview, 2 previous claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2024-12-01']),
        expected: { isValid: false, reason: 'another review within 10 months' }
      },
      {
        test: 'no vetVisitReview, 2 previous claims - 1 within 10 months, 2 future 0 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: generateMockPreviousClaim(['2024-12-01', '2025-12-01']),
        expected: { isValid: false, reason: 'another review within 10 months' }
      },
      {
        test: 'no vetVisitReview, 2 previous claims - 0 within 10 months, 0 future 2 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2023-12-01']),
        expected: { isValid: true }
      },
      {
        test: 'no vetVisitReview, 2 previous claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2025-12-01']),
        expected: { isValid: true }
      },
      {
        test: 'no vetVisitReview, 2 previous claims - 0 within 10 months, 2 future 0 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: generateMockPreviousClaim(['2026-11-01', '2027-12-01']),
        expected: { isValid: true }
      }
    ])('$test | isValidDateOfVisit = $expected', ({ dateOfVisit, previousClaims, vetVisitReview, expected }) => {
      expect(isValidDateOfVisit(dateOfVisit, 'R', previousClaims, vetVisitReview)).toEqual(expected)
    })
  })

  describe('ENDEMICS', () => {
    test.each([
      {
        test: 'vetVisitReview within last 10 months, no previous claims',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: undefined,
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, no previous claims',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: undefined,
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous claims - 1 within 10 months, 0 future 2 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2024-05-01']),
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2024-12-01']),
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous claims - 1 within 10 months, 2 future 0 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: generateMockPreviousClaim(['2024-12-01', '2025-12-01']),
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous claims - 0 within 10 months, 0 future 2 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2023-12-01']),
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2025-12-01']),
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous claims - 0 within 10 months, 2 future 0 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: generateMockPreviousClaim(['2026-11-01', '2027-12-01']),
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous claims - 1 within 10 months, 0 future 2 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2024-05-01']),
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous claims - 1 within 10 months (future), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2024-12-01']),
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous claims - 1 within 10 months (past), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2024-05-01', '2025-12-01']),
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous claims - 1 within 10 months, 2 future 0 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2024-12-01', '2025-12-01']),
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous claims - 0 within 10 months, 0 future 2 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2023-12-01']),
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2025-12-01']),
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous claims - 0 within 10 months, 2 future 0 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2025-12-01', '2026-12-01']),
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous claims - 1 within 10 months, 0 future 2 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2024-05-01']),
        expected: { isValid: true }
      },
      {
        test: 'no vetVisitReview, 2 previous claims - 1 within 10 months (future), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2024-12-01']),
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous claims - 1 within 10 months, 2 future 0 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: generateMockPreviousClaim(['2024-12-01', '2025-12-01']),
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous claims - 1 within 10 months (past), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: generateMockPreviousClaim(['2024-05-01', '2025-12-01']),
        expected: { isValid: true }
      },
      {
        test: 'no vetVisitReview, 2 previous claims - 0 within 10 months, 0 future 2 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2023-12-01']),
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: generateMockPreviousClaim(['2023-01-01', '2025-12-01']),
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous claims - 0 within 10 months, 2 future 0 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: generateMockPreviousClaim(['2026-11-01', '2027-12-01']),
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E'),
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E'),
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous review claims - 1 within 10 months, 0 future 2 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-05-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous review claims - 1 within 10 months, 1 future 1 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous review claims - 1 within 10 months, 2 future 0 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: [...generateMockPreviousClaim(['2024-12-01', '2025-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous review claims - 0 within 10 months, 0 future 2 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2023-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous review claims - 0 within 10 months, 1 future 1 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2025-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous review claims - 0 within 10 months, 2 future 0 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: [...generateMockPreviousClaim(['2026-11-01', '2027-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous review claims - 1 within 10 months, 0 future 2 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-05-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous review claims - 1 within 10 months (future), 1 future 1 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous review claims - 1 within 10 months (past), 1 future 1 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: [...generateMockPreviousClaim(['2024-05-01', '2025-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: true }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous review claims - 1 within 10 months, 2 future 0 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: [...generateMockPreviousClaim(['2024-12-01', '2025-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous review claims - 0 within 10 months, 0 future 2 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2023-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous review claims - 0 within 10 months, 1 future 1 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2025-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous review claims - 0 within 10 months, 2 future 0 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: [...generateMockPreviousClaim(['2025-12-01', '2026-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 1 within 10 months, 0 future 2 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-05-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: true }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 1 within 10 months (future), 1 future 1 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 1 within 10 months (past), 1 future 1 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2024-03-01', '2025-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: true }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 1 within 10 months, 2 future 0 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2024-12-01', '2025-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 0 within 10 months, 0 future 2 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2023-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 0 within 10 months, 1 future 1 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2025-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 0 within 10 months, 2 future 0 past. 2 previous endemics claims - 0 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2026-11-01', '2027-12-01']), ...generateMockPreviousClaim(['2023-12-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous endemics claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E'),
        expected: { isValid: false, reason: 'another endemics within 10 months' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous endemics claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E'),
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous review claims - 1 within 10 months, 0 future 2 past. 2 previous endemics claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-05-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'another endemics within 10 months' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous review claims - 1 within 10 months, 1 future 1 past. 2 previous endemics claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'another endemics within 10 months' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous review claims - 1 within 10 months, 2 future 0 past. 2 previous endemics claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: [...generateMockPreviousClaim(['2024-12-01', '2025-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'another endemics within 10 months' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous review claims - 0 within 10 months, 0 future 2 past. 2 previous endemics claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2023-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'another endemics within 10 months' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous review claims - 0 within 10 months, 1 future 1 past. 2 previous endemics claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2025-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'another endemics within 10 months' }
      },
      {
        test: 'vetVisitReview within last 10 months, 2 previous review claims - 0 within 10 months, 2 future 0 past. 2 previous endemics claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01'),
        previousClaims: [...generateMockPreviousClaim(['2026-11-01', '2027-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'another endemics within 10 months' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous review claims - 1 within 10 months, 0 future 2 past. 2 previous endemics claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-05-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'another endemics within 10 months' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous review claims - 1 within 10 months, 1 future 1 past. 2 previous endemics claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous review claims - 1 within 10 months, 2 future 0 past. 2 previous endemics claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: [...generateMockPreviousClaim(['2024-12-01', '2025-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous review claims - 0 within 10 months, 0 future 2 past. 2 previous endemics claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2023-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous review claims - 0 within 10 months, 1 future 1 past. 2 previous endemics claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2025-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'vetVisitReview NOT within last 10 months, 2 previous review claims - 0 within 10 months, 2 future 0 past. 2 previous endemics claims - 1 within 10 months, 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-01-01'),
        previousClaims: [...generateMockPreviousClaim(['2025-12-01', '2026-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 1 within 10 months, 0 future 2 past. 2 previous endemics claims - 1 within 10 months (past), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-05-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'another endemics within 10 months' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 1 within 10 months, 1 future 1 past. 2 previous endemics claims - 1 within 10 months (past), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 1 within 10 months, 2 future 0 past. 2 previous endemics claims - 1 within 10 months (past), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2024-12-01', '2025-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 0 within 10 months, 0 future 2 past. 2 previous endemics claims - 1 within 10 months (past), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2023-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 0 within 10 months, 1 future 1 past. 2 previous endemics claims - 1 within 10 months (past), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2025-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 0 within 10 months, 2 future 0 past. 2 previous endemics claims - 1 within 10 months (past), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2026-11-01', '2027-12-01']), ...generateMockPreviousClaim(['2024-05-01', '2025-11-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 1 within 10 months, 0 future 2 past. 2 previous endemics claims - 1 within 10 months (future), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-05-01']), ...generateMockPreviousClaim(['2023-01-01', '2025-01-01'], 'E')],
        expected: { isValid: false, reason: 'another endemics within 10 months' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 1 within 10 months, 1 future 1 past. 2 previous endemics claims - 1 within 10 months (future), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-12-01']), ...generateMockPreviousClaim(['2023-01-01', '2025-01-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 1 within 10 months, 2 future 0 past. 2 previous endemics claims - 1 within 10 months (future), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2024-12-01', '2025-12-01']), ...generateMockPreviousClaim(['2023-01-01', '2025-01-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 0 within 10 months, 0 future 2 past. 2 previous endemics claims - 1 within 10 months (future), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2023-12-01']), ...generateMockPreviousClaim(['2023-01-01', '2025-01-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 0 within 10 months, 1 future 1 past. 2 previous endemics claims - 1 within 10 months (future), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2025-12-01']), ...generateMockPreviousClaim(['2023-01-01', '2025-01-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 0 within 10 months, 2 future 0 past. 2 previous endemics claims - 1 within 10 months (future), 1 future 1 past',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2026-11-01', '2027-12-01']), ...generateMockPreviousClaim(['2023-01-01', '2025-01-01'], 'E')],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 1 within 10 months, 1 future 1 past, 1 REJECTED (past)',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2026-11-01']), ...generateMockPreviousClaim(['2024-05-01'], 'R', 10)],
        expected: { isValid: false, reason: 'rejected review' }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 1 within 10 months, 1 future 1 past, 1 REJECTED (future)',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2026-11-01'], 'R', 10), ...generateMockPreviousClaim(['2024-05-01'])],
        expected: { isValid: true }
      },
      {
        test: 'no vetVisitReview, 2 previous review claims - 0 within 10 months, 1 future 1 past, 1 REJECTED (future)',
        dateOfVisit: '2024-11-01',
        vetVisitReview: undefined,
        previousClaims: [...generateMockPreviousClaim(['2026-11-01'], 'R', 10), ...generateMockPreviousClaim(['2023-05-01'], 'R', 10)],
        expected: { isValid: false, reason: 'no review within 10 months past' }
      },

      {
        test: 'vetVisitReview within 10 months (REJECTED), 0 previous review claims',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2024-05-01', 10),
        previousClaims: undefined,
        expected: { isValid: false, reason: 'rejected review' }
      },
      {
        test: 'vetVisitReview not within 10 months (REJECTED), 0 previous review claims',
        dateOfVisit: '2024-11-01',
        vetVisitReview: generateMockVetVisitReview('2023-05-01', 10),
        previousClaims: undefined,
        expected: { isValid: false, reason: 'no review within 10 months past' }
      }
    ])('$test | isValidDateOfVisit', ({ dateOfVisit, previousClaims, vetVisitReview, expected }) => {
      expect(isValidDateOfVisit(dateOfVisit, 'E', previousClaims, vetVisitReview)).toEqual(expected)
    })
  })
})
