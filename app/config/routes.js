const config = require('../config')

module.exports = {
  vetVisits: config.vetVisits,
  endemicsIndex: 'endemics',
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
  endemicsWhichTypeOfReview: 'endemics/which-type-of-review',
  endemicsSpeciesNumbers: 'endemics/species-numbers',
  endemicsYouCannotClaim: 'endemics/you-cannot-claim',
  endemicsNumberOfSpeciesTested: 'endemics/number-of-species-tested',
  endemicsNumberOfSpeciesException: 'endemics/number-of-species-exception',
  endemicsSpeciesNumbersException: 'endemics/species-numbers-exception'
}
