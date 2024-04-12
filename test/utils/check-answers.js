const getRowKeys = ($) => {
  return $('.govuk-summary-list__key').map((index, element) => $(element).text().trim()).get()
}
const getRowContents = ($) => {
  return $('.govuk-summary-list__value').map((index, element) => $(element).text().trim()).get()
}
const getRowActionTexts = ($) => {
  return $('.govuk-summary-list__actions').map((index, element) => $(element).text().trim()).get()
}
const getRowLinks = ($) => {
  return $('.govuk-summary-list__actions .govuk-link').map((index, element) => $(element).attr('href')).get()
}

const commonVetRowKeys = [
  "Vet's name",
  "Vet's RCVS number"
]

const commonVetRowActionTexts = [
  "Change change vet's name",
  "Change change vet's rcvs number"
]

const commonReviewRowKeys = [
  'Business name',
  'Livestock',
  'Review or follow-up',
  'Date of review',
  'Date of sampling'
]

const commonEndemicsFollowUpRowKeys = [
  'Business name',
  'Livestock',
  'Review or follow-up',
  'Date of follow-up',
  'Date of sampling'
]

// Review claim data
const baseReviewClaim = {
  organisation: { name: 'business name' },
  typeOfReview: 'R',
  dateOfVisit: '2023-12-19T10:25:11.318Z',
  dateOfTesting: '2023-12-19T10:25:11.318Z',
  speciesNumbers: 'Yes',
  vetsName: 'George',
  vetRCVSNumber: '1234567',
  laboratoryURN: 'laboratoryURN'
}

const beefReviewClaim = { ...baseReviewClaim, typeOfLivestock: 'beef', numberAnimalsTested: '42', testResults: 'positive' }
const dairyReviewClaim = { ...baseReviewClaim, typeOfLivestock: 'dairy', testResults: 'positive' }
const pigsReviewClaim = { ...baseReviewClaim, typeOfLivestock: 'pigs', numberAnimalsTested: '42', numberOfOralFluidSamples: '10', testResults: 'positive' }
const sheepReviewClaim = { ...baseReviewClaim, typeOfLivestock: 'sheep', numberAnimalsTested: '42' }

const expectedReviewBeef = {
  rowKeys: [
    ...commonReviewRowKeys,
    '11 or more beef cattle',
    'Number of animals tested',
    ...commonVetRowKeys,
    'Test results URN',
    'Test results'
  ],
  rowContents: [
    'Business name',
    'Beef cattle',
    'Annual health and welfare review',
    '19 December 2023',
    '19 December 2023',
    'Yes',
    '42',
    'George',
    '1234567',
    'laboratoryURN',
    'Positive'
  ],
  rowActionTexts: [
    'Change change date of review',
    'Change change date of sampling',
    'Change change number of species',
    'Change change number of animals tested',
    ...commonVetRowActionTexts,
    'Change change test URN',
    'Change change test results'
  ],
  rowLinks: [
    '/claim/endemics/date-of-visit',
    '/claim/endemics/date-of-testing',
    '/claim/endemics/species-numbers',
    '/claim/endemics/number-of-species-tested',
    '/claim/endemics/vet-name',
    '/claim/endemics/vet-rcvs',
    '/claim/endemics/test-urn',
    '/claim/endemics/test-results'
  ]
}

const expectedReviewDairy = {
  rowKeys: [
    ...commonReviewRowKeys,
    '11 or more dairy cattle',
    ...commonVetRowKeys,
    'Test results URN',
    'Test results'
  ],
  rowContents: [
    'Business name',
    'Dairy cattle',
    'Annual health and welfare review',
    '19 December 2023',
    '19 December 2023',
    'Yes',
    'George',
    '1234567',
    'laboratoryURN',
    'Positive'
  ],
  rowActionTexts: [
    'Change change date of review',
    'Change change date of sampling',
    'Change change number of species',
    ...commonVetRowActionTexts,
    'Change change test URN',
    'Change change test results'
  ],
  rowLinks: [
    '/claim/endemics/date-of-visit',
    '/claim/endemics/date-of-testing',
    '/claim/endemics/species-numbers',
    '/claim/endemics/vet-name',
    '/claim/endemics/vet-rcvs',
    '/claim/endemics/test-urn',
    '/claim/endemics/test-results'
  ]
}

const expectedReviewPigs = {
  rowKeys: [
    ...commonReviewRowKeys,
    '51 or more pigs',
    'Number of animals tested',
    ...commonVetRowKeys,
    'Test results URN',
    'Number of oral fluid samples taken',
    'Test results'
  ],
  rowContents: [
    'Business name',
    'Pigs',
    'Annual health and welfare review',
    '19 December 2023',
    '19 December 2023',
    'Yes',
    '42',
    'George',
    '1234567',
    'laboratoryURN',
    '10',
    'Positive'
  ],
  rowActionTexts: [
    'Change change date of review',
    'Change change date of sampling',
    'Change change number of species',
    'Change change number of animals tested',
    ...commonVetRowActionTexts,
    'Change change test URN',
    'Change change number of oral fluid samples taken',
    'Change change test results'
  ],
  rowLinks: [
    '/claim/endemics/date-of-visit',
    '/claim/endemics/date-of-testing',
    '/claim/endemics/species-numbers',
    '/claim/endemics/number-of-species-tested',
    '/claim/endemics/vet-name',
    '/claim/endemics/vet-rcvs',
    '/claim/endemics/test-urn',
    '/claim/endemics/number-of-fluid-oral-samples',
    '/claim/endemics/test-results'
  ]
}

const expectedReviewSheep = {
  rowKeys: [
    ...commonReviewRowKeys,
    '21 or more sheep',
    'Number of animals tested',
    ...commonVetRowKeys,
    'Test results URN'
  ],
  rowContents: [
    'Business name',
    'Sheep',
    'Annual health and welfare review',
    '19 December 2023',
    '19 December 2023',
    'Yes',
    '42',
    'George',
    '1234567',
    'laboratoryURN'
  ],
  rowActionTexts: [
    'Change change date of review',
    'Change change date of sampling',
    'Change change number of species',
    'Change change number of animals tested',
    ...commonVetRowActionTexts,
    'Change change test URN'
  ],
  rowLinks: [
    '/claim/endemics/date-of-visit',
    '/claim/endemics/date-of-testing',
    '/claim/endemics/species-numbers',
    '/claim/endemics/number-of-species-tested',
    '/claim/endemics/vet-name',
    '/claim/endemics/vet-rcvs',
    '/claim/endemics/test-urn'
  ]
}

// Endemic follow-up claim data
const baseEndemicsFollowUpClaim = {
  organisation: { name: 'business name' },
  typeOfReview: 'E',
  dateOfVisit: '2023-12-19T10:25:11.318Z',
  dateOfTesting: '2023-12-19T10:25:11.318Z',
  speciesNumbers: 'Yes',
  vetsName: 'George',
  vetRCVSNumber: '1234567',
  laboratoryURN: 'laboratoryURN'
}

const sheepEndemicsPackage = 'reducedExternalParasites'
const sheepTestResults = [
  { diseaseType: 'flystrike', result: 'clinicalSymptomsPresent' },
  { diseaseType: 'sheepScab', result: 'negative' },
  {
    diseaseType: 'other',
    result: [
      { diseaseType: 'disease one', testResult: 'test result one' },
      { diseaseType: 'disease two', testResult: 'test result two' }
    ]
  }
]

const beefEndemicsFollowUpClaim = { ...baseEndemicsFollowUpClaim, typeOfLivestock: 'beef', numberAnimalsTested: '42', testResults: 'positive', biosecurity: 'yes' }
const dairyEndemicsFollowUpClaim = { ...baseEndemicsFollowUpClaim, typeOfLivestock: 'dairy', testResults: 'positive', biosecurity: 'yes' }
const pigEndemicsFollowUpClaim = { ...baseEndemicsFollowUpClaim, typeOfLivestock: 'pigs', numberAnimalsTested: '42', numberOfSamplesTested: '5', diseaseStatus: '3', herdVaccinationStatus: 'vaccinated', biosecurity: { biosecurity: 'yes', assessmentPercentage: '50' } }
const sheepEndemicsFollowUpClaim = { ...baseEndemicsFollowUpClaim, typeOfLivestock: 'sheep', numberAnimalsTested: '42', sheepEndemicsPackage, sheepTestResults }

const expectedEndemicsFollowUpBeef = {
  rowKeys: [
    ...commonEndemicsFollowUpRowKeys,
    '11 or more beef cattle',
    'Number of animals tested',
    ...commonVetRowKeys,
    'Test results URN',
    'Test results',
    'Biosecurity assessment'
  ],
  rowContents: [
    'Business name',
    'Beef cattle',
    'Endemic disease follow-up',
    '19 December 2023',
    '19 December 2023',
    'Yes',
    '42',
    'George',
    '1234567',
    'laboratoryURN',
    'Positive',
    'Yes'
  ],
  rowActionTexts: [
    'Change change date of follow-up',
    'Change change date of sampling',
    'Change change number of species',
    'Change change number of animals tested',
    ...commonVetRowActionTexts,
    'Change change test URN',
    'Change change test results',
    'Change change biosecurity assessment'
  ],
  rowLinks: [
    '/claim/endemics/date-of-visit',
    '/claim/endemics/date-of-testing',
    '/claim/endemics/species-numbers',
    '/claim/endemics/number-of-species-tested',
    '/claim/endemics/vet-name',
    '/claim/endemics/vet-rcvs',
    '/claim/endemics/test-urn',
    '/claim/endemics/test-results',
    '/claim/endemics/biosecurity'
  ]
}

const expectedEndemicsFollowUpDairy = {
  rowKeys: [
    ...commonEndemicsFollowUpRowKeys,
    '11 or more dairy cattle',
    ...commonVetRowKeys,
    'Test results URN',
    'Test results',
    'Biosecurity assessment'
  ],
  rowContents: [
    'Business name',
    'Dairy cattle',
    'Endemic disease follow-up',
    '19 December 2023',
    '19 December 2023',
    'Yes',
    'George',
    '1234567',
    'laboratoryURN',
    'Positive',
    'Yes'
  ],
  rowActionTexts: [
    'Change change date of follow-up',
    'Change change date of sampling',
    'Change change number of species',
    ...commonVetRowActionTexts,
    'Change change test URN',
    'Change change test results',
    'Change change biosecurity assessment'
  ],
  rowLinks: [
    '/claim/endemics/date-of-visit',
    '/claim/endemics/date-of-testing',
    '/claim/endemics/species-numbers',
    '/claim/endemics/vet-name',
    '/claim/endemics/vet-rcvs',
    '/claim/endemics/test-urn',
    '/claim/endemics/test-results',
    '/claim/endemics/biosecurity'
  ]
}

const expectedEndemicsFollowUpPigs = {
  rowKeys: [
    ...commonEndemicsFollowUpRowKeys,
    '51 or more pigs',
    'Number of animals tested',
    ...commonVetRowKeys,
    'Herd vaccination status',
    'Test results URN',
    'Samples tested',
    'Diseases status category',
    'Biosecurity assessment'
  ],
  rowContents: [
    'Business name',
    'Pigs',
    'Endemic disease follow-up',
    '19 December 2023',
    '19 December 2023',
    'Yes',
    '42',
    'George',
    '1234567',
    'Vaccinated',
    'laboratoryURN',
    '5',
    '3',
    'Yes, Assessment percentage: 50%'
  ],
  rowActionTexts: [
    'Change change date of follow-up',
    'Change change date of sampling',
    'Change change number of species',
    'Change change number of animals tested',
    ...commonVetRowActionTexts,
    'Change change herd vaccination status',
    'Change change test URN',
    'Change change number of samples tested',
    'Change change diseases status category',
    'Change change biosecurity assessment'
  ],
  rowLinks: [
    '/claim/endemics/date-of-visit',
    '/claim/endemics/date-of-testing',
    '/claim/endemics/species-numbers',
    '/claim/endemics/number-of-species-tested',
    '/claim/endemics/vet-name',
    '/claim/endemics/vet-rcvs',
    '/claim/endemics/vaccination',
    '/claim/endemics/test-urn',
    '/claim/endemics/number-of-samples-tested',
    '/claim/endemics/disease-status',
    '/claim/endemics/biosecurity'
  ]
}

const expectedEndemicsFollowUpSheep = {
  rowKeys: [
    ...commonEndemicsFollowUpRowKeys,
    '21 or more sheep',
    'Number of animals tested',
    ...commonVetRowKeys,
    'Test results URN',
    'Sheep health package',
    'Disease test and result',
    '',
    ''
  ],
  rowContents: [
    'Business name',
    'Sheep',
    'Endemic disease follow-up',
    '19 December 2023',
    '19 December 2023',
    'Yes',
    '42',
    'George',
    '1234567',
    'laboratoryURN',
    'Reduced level of external parasites',
    'Flystrike (Clinical symptoms present)',
    'Sheep scab (Negative)',
    'disease one (test result one) disease two (test result two)'
  ],
  rowActionTexts: [
    'Change change date of follow-up',
    'Change change date of sampling',
    'Change change number of species',
    'Change change number of animals tested',
    ...commonVetRowActionTexts,
    'Change change test URN',
    'Change change sheep health package',
    'Change change disease type flystrike and test result',
    'Change change disease type sheepScab and test result',
    'Change change disease type other and test result'
  ],
  rowLinks: [
    '/claim/endemics/date-of-visit',
    '/claim/endemics/date-of-testing',
    '/claim/endemics/species-numbers',
    '/claim/endemics/number-of-species-tested',
    '/claim/endemics/vet-name',
    '/claim/endemics/vet-rcvs',
    '/claim/endemics/test-urn',
    '/claim/endemics/sheep-endemics-package',
    '/claim/endemics/sheep-test-results?diseaseType=flystrike',
    '/claim/endemics/sheep-test-results?diseaseType=sheepScab',
    '/claim/endemics/sheep-test-results?diseaseType=other'
  ]
}

module.exports = {
  beefReviewClaim,
  dairyReviewClaim,
  pigsReviewClaim,
  sheepReviewClaim,
  beefEndemicsFollowUpClaim,
  dairyEndemicsFollowUpClaim,
  pigEndemicsFollowUpClaim,
  sheepEndemicsFollowUpClaim,
  expectedReviewBeef,
  expectedReviewDairy,
  expectedReviewPigs,
  expectedReviewSheep,
  expectedEndemicsFollowUpBeef,
  expectedEndemicsFollowUpDairy,
  expectedEndemicsFollowUpPigs,
  expectedEndemicsFollowUpSheep,
  getRowKeys,
  getRowContents,
  getRowActionTexts,
  getRowLinks
}
