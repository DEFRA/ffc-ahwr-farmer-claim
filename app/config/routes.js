const config = require('../config')

module.exports = {
  vetVisits: config.vetVisits,
  endemicsDateOfVisit: 'endemics/date-of-visit',
  endemicsDateOfTesting: 'endemics/date-of-testing',
  endemicsTestResults: 'endemics/test-results',
  endemicsCheckAnswers: 'endemics/check-answers',
  endemicsVetName: 'endemics/vet-name',
  endemicsVetRCVS: 'endemics/vet-rcvs',
  endemicsTestUrn: 'endemics/test-urn',
  endemicsNumberOfOralFluidSamples: 'endemics/number-of-fluid-oral-samples',
  endemicsNumberOfOralFluidSamplesException: 'endemics/number-of-fluid-oral-samples-exception',
  endemicsNumberOfTests: 'endemics/number-of-tests',
  endemicsWhichReviewAnnual: 'endemics/which-review-annual',
  endemicsSpeciesNumbers: 'endemics/species-numbers',
  endemicsEligibility: 'endemics/number-of-species-tested',
  endemicsIneligibility: 'endemics/number-of-animals-exception'
}
