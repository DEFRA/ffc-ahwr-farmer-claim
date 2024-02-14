const config = require('../config')

module.exports = {
  vetVisits: config.vetVisits,
  endemicsIndex: 'endemics',
  endemicsWhichReviewAnnual: 'endemics/which-review-annual',
  endemicsWhichTypeOfReview: 'endemics/which-type-of-review',
  endemicsYouCannotClaim: 'endemics/you-cannot-claim',
  endemicsDateOfVisit: 'endemics/date-of-visit',
  endemicsDateOfTesting: 'endemics/date-of-testing',
  endemicsVetName: 'endemics/vet-name',
  endemicsVetRCVS: 'endemics/vet-rcvs',
  endemicsTestUrn: 'endemics/test-urn',
  endemicsNumberOfTests: 'endemics/number-of-tests',
  endemicsSpeciesNumbers: 'endemics/species-numbers',
  endemicsSpeciesNumbersException: 'endemics/species-numbers-exception',
  endemicsNumberOfSpeciesTested: 'endemics/number-of-species-tested',
  endemicsNumberOfSpeciesException: 'endemics/number-of-species-exception',
  endemicsNumberOfOralFluidSamples: 'endemics/number-of-fluid-oral-samples',
  endemicsNumberOfOralFluidSamplesException: 'endemics/number-of-fluid-oral-samples-exception',
  endemicsTestResults: 'endemics/test-results',
  endemicsCheckAnswers: 'endemics/check-answers',
  endemicsConfirmation: 'endemics/confirmation'
}
