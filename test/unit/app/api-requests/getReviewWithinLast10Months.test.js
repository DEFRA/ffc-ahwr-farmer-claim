const { getReviewWithinLast10Months } = require('../../../../app/api-requests/claim-service-api')

const generateMockPreviousClaim = (data, type = 'R') => {
  return data.map((d) => (
    {
      data: { dateOfVisit: d },
      type
    }
  ))
}

const generateMockVetVisitReview = (date) => {
  return {
    data: { visitDate: date }
  }
}

describe('getReviewWithinLast10Months test', () => {
  test.each([
    {
      title: 'no vetVisitReview, no previousClaims',
      dateOfVisit: '2024-11-01',
      previousClaims: undefined,
      vetVisitReview: undefined,
      expected: undefined
    },
    {
      title: 'no vetVisitReview, 2 previous review claims - 0 within 10 months',
      dateOfVisit: '2024-11-01',
      previousClaims: generateMockPreviousClaim(['2023-01-01', '2023-05-01']),
      vetVisitReview: undefined,
      expected: undefined
    },
    {
      title: 'no vetVisitReview, 2 previous review claims - 0 within 10 months, 1 previous endemics claim within 10 months',
      dateOfVisit: '2024-11-01',
      previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2023-05-01']), ...generateMockPreviousClaim(['2024-05-01'], 'E')],
      vetVisitReview: undefined,
      expected: undefined
    },
    {
      title: 'no vetVisitReview, 2 previous review claims - 1 within 10 months',
      dateOfVisit: '2024-11-01',
      previousClaims: generateMockPreviousClaim(['2023-01-01', '2024-05-01']),
      vetVisitReview: undefined,
      expected: { data: { dateOfVisit: '2024-05-01' }, type: 'R' }
    },
    {
      title: 'no vetVisitReview, 2 previous review claims - 1 within 10 months, 1 previous endemics claim within 10 months',
      dateOfVisit: '2024-11-01',
      previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-05-01']), ...generateMockPreviousClaim(['2024-05-01'], 'E')],
      vetVisitReview: undefined,
      expected: { data: { dateOfVisit: '2024-05-01' }, type: 'R' }
    },
    {
      title: 'no vetVisitReview, 2 previous review claims - 2 within 10 months - 1 future 1 past',
      dateOfVisit: '2024-11-01',
      previousClaims: generateMockPreviousClaim(['2024-05-01', '2025-01-01']),
      vetVisitReview: undefined,
      expected: { data: { dateOfVisit: '2024-05-01' }, type: 'R' }
    },
    {
      title: 'no vetVisitReview, 2 previous review claims - 2 within 10 months - 1 future 1 past, 1 previous endemics claim within 10 months',
      dateOfVisit: '2024-11-01',
      previousClaims: [...generateMockPreviousClaim(['2024-05-01', '2025-01-01']), ...generateMockPreviousClaim(['2024-05-01'], 'E')],
      vetVisitReview: undefined,
      expected: { data: { dateOfVisit: '2024-05-01' }, type: 'R' }
    },
    {
      title: 'no vetVisitReview, 2 previous review claims - 2 within 10 months - 1 future 1 past | swapped order',
      dateOfVisit: '2024-11-01',
      previousClaims: generateMockPreviousClaim(['2025-01-01', '2024-05-01']),
      vetVisitReview: undefined,
      expected: { data: { dateOfVisit: '2024-05-01' }, type: 'R' }
    },
    {
      title: 'no vetVisitReview, 2 previous review claims - 2 within 10 months - 1 future 1 past, 1 previous endemics claim within 10 months | swapped order',
      dateOfVisit: '2024-11-01',
      previousClaims: [...generateMockPreviousClaim(['2025-01-01', '2024-05-01']), ...generateMockPreviousClaim(['2024-05-01'], 'E')],
      vetVisitReview: undefined,
      expected: { data: { dateOfVisit: '2024-05-01' }, type: 'R' }
    },
    {
      title: 'vetVisitReview as oldest (not within 10 months), 2 previous review claims - 0 within 10 months',
      dateOfVisit: '2024-11-01',
      previousClaims: generateMockPreviousClaim(['2023-01-01', '2023-05-01']),
      vetVisitReview: generateMockVetVisitReview('2022-01-01'),
      expected: undefined
    },
    {
      title: 'vetVisitReview as oldest (not within 10 months), 2 previous review claims - 0 within 10 months, 1 previous endemics claim within 10 months',
      dateOfVisit: '2024-11-01',
      previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2023-05-01']), ...generateMockPreviousClaim(['2024-05-01'], 'E')],
      vetVisitReview: generateMockVetVisitReview('2022-01-01'),
      expected: undefined
    },
    {
      title: 'vetVisitReview as oldest (not within 10 months), 2 previous review claims - 1 within 10 months',
      dateOfVisit: '2024-11-01',
      previousClaims: generateMockPreviousClaim(['2023-01-01', '2024-05-01']),
      vetVisitReview: generateMockVetVisitReview('2022-01-01'),
      expected: { data: { dateOfVisit: '2024-05-01' }, type: 'R' }
    },
    {
      title: 'vetVisitReview as oldest (not within 10 months), 2 previous review claims - 1 within 10 months, 1 previous endemics claim within 10 months',
      dateOfVisit: '2024-11-01',
      previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2024-05-01']), ...generateMockPreviousClaim(['2024-05-01'], 'E')],
      vetVisitReview: generateMockVetVisitReview('2022-01-01'),
      expected: { data: { dateOfVisit: '2024-05-01' }, type: 'R' }
    },
    {
      title: 'vetVisitReview as oldest (not within 10 months), 2 previous review claims - 2 within 10 months - 1 future 1 past',
      dateOfVisit: '2024-11-01',
      previousClaims: generateMockPreviousClaim(['2024-05-01', '2025-01-01']),
      vetVisitReview: generateMockVetVisitReview('2022-01-01'),
      expected: { data: { dateOfVisit: '2024-05-01' }, type: 'R' }
    },
    {
      title: 'vetVisitReview as oldest (not within 10 months), 2 previous review claims - 2 within 10 months - 1 future 1 past, 1 previous endemics claim within 10 months',
      dateOfVisit: '2024-11-01',
      previousClaims: [...generateMockPreviousClaim(['2024-05-01', '2025-01-01']), ...generateMockPreviousClaim(['2024-05-01'], 'E')],
      vetVisitReview: generateMockVetVisitReview('2022-01-01'),
      expected: { data: { dateOfVisit: '2024-05-01' }, type: 'R' }
    },
    {
      title: 'vetVisitReview as oldest (not within 10 months), 2 previous review claims - 2 within 10 months - 1 future 1 past | swapped order',
      dateOfVisit: '2024-11-01',
      previousClaims: generateMockPreviousClaim(['2025-01-01', '2024-05-01']),
      vetVisitReview: generateMockVetVisitReview('2022-01-01'),
      expected: { data: { dateOfVisit: '2024-05-01' }, type: 'R' }
    },
    {
      title: 'vetVisitReview as oldest (not within 10 months), 2 previous review claims - 2 within 10 months - 1 future 1 past, 1 previous endemics claim within 10 months | swapped order',
      dateOfVisit: '2024-11-01',
      previousClaims: [...generateMockPreviousClaim(['2025-01-01', '2024-05-01']), ...generateMockPreviousClaim(['2024-05-01'], 'E')],
      vetVisitReview: generateMockVetVisitReview('2022-01-01'),
      expected: { data: { dateOfVisit: '2024-05-01' }, type: 'R' }
    },
    {
      title: 'vetVisitReview within 10 months, no previous review claims',
      dateOfVisit: '2024-11-01',
      previousClaims: undefined,
      vetVisitReview: generateMockVetVisitReview('2024-05-01'),
      expected: { data: { dateOfVisit: '2024-05-01', visitDate: '2024-05-01' } }
    },
    {
      title: 'vetVisitReview within 10 months, 2 previous review claims - 0 within 10 months, 1 previous endeimcs claim',
      dateOfVisit: '2024-11-01',
      previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2023-05-01']), ...generateMockPreviousClaim(['2024-05-01'], 'E')],
      vetVisitReview: generateMockVetVisitReview('2024-05-01'),
      expected: { data: { dateOfVisit: '2024-05-01', visitDate: '2024-05-01' } }
    },
    {
      title: 'vetVisitReview within 10 months, 2 previous review claims - 1 within 10 months (future), 1 previous endeimcs claim',
      dateOfVisit: '2024-11-01',
      previousClaims: [...generateMockPreviousClaim(['2023-01-01', '2025-01-01']), ...generateMockPreviousClaim(['2024-05-01'], 'E')],
      vetVisitReview: generateMockVetVisitReview('2024-05-01'),
      expected: { data: { dateOfVisit: '2024-05-01', visitDate: '2024-05-01' } }
    }
  ])('$title | getReviewWithinLast10Months', ({ dateOfVisit, previousClaims, vetVisitReview, expected }) => {
    expect(getReviewWithinLast10Months(dateOfVisit, previousClaims, vetVisitReview)).toEqual(expected)
  })
})
