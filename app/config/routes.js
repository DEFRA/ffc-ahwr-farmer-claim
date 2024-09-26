const config = require('../config')

module.exports = {
  claimDashboard: `${config.dashboardServiceUri}/vet-visits`,
  endemicsIndex: 'endemics',
  endemicsWhichSpecies: 'endemics/which-species',
  endemicsWhichTypeOfReview: 'endemics/which-type-of-review',
  endemicsWhichTypeOfReviewDairyFollowUpException: 'endemics/which-type-of-review-dairy-follow-up-exception',
  endemicsDateOfVisit: 'endemics/date-of-visit',
  endemicsDateOfVisitException: 'endemics/date-of-visit-exception',
  endemicsDateOfTesting: 'endemics/date-of-testing',
  endemicsDateOfTestingException: 'endemics/date-of-testing-exception',
  endemicsVetName: 'endemics/vet-name',
  endemicsVetRCVS: 'endemics/vet-rcvs',
  endemicsTestUrn: 'endemics/test-urn',
  endemicsNumberOfTests: 'endemics/number-of-tests',
  endemicsSpeciesNumbers: 'endemics/species-numbers',
  endemicsSheepName: 'endemics/sheep-name',
  endemicsSpeciesNumbersException: 'endemics/species-numbers-exception',
  endemicsNumberOfSpeciesTested: 'endemics/number-of-species-tested',
  endemicsNumberOfSpeciesException: 'endemics/number-of-species-exception',
  endemicsNumberOfOralFluidSamples: 'endemics/number-of-fluid-oral-samples',
  endemicsNumberOfOralFluidSamplesException: 'endemics/number-of-fluid-oral-samples-exception',
  endemicsNumberOfSamplesTested: 'endemics/number-of-samples-tested',
  endemicsNumberOfSamplesTestedException: 'endemics/number-of-samples-tested-exception',
  endemicsTestResults: 'endemics/test-results',
  endemicsCheckAnswers: 'endemics/check-answers',
  endemicsConfirmation: 'endemics/confirmation',
  endemicsVaccination: 'endemics/vaccination',
  endemicsDiseaseStatus: 'endemics/disease-status',
  endemicsSheepEndemicsPackage: 'endemics/sheep-endemics-package',
  endemicsSheepTests: 'endemics/sheep-tests',
  endemicsBiosecurity: 'endemics/biosecurity',
  endemicsBiosecurityException: 'endemics/biosecurity-exception',
  endemicsNumberOfSpeciesSheepException: 'endemics/number-of-species-sheep-exception',
  endemicsNumberOfSpeciesPigsException: 'endemics/number-of-species-pigs-exception',
  endemicsVetVisitsReviewTestResults: 'endemics/vet-visits-review-test-results',
  endemicsSheepTestResults: 'endemics/sheep-test-results',
  endemicsPIHunt: 'endemics/pi-hunt',
  endemicsPIHuntException: 'endemics/pi-hunt-exception',
  endemicsTestUrnException: 'endemics/test-urn-exception',
  endemicsPIHuntRecommended: 'endemics/pi-hunt-recommended',
  endemicsPIHuntRecommendedException: 'endemics/pi-hunt-recommended-exception',
  endemicsPIHuntAllAnimals: 'endemics/pi-hunt-all-animals',
  endemicsPIHuntAllAnimalsException: 'endemics/pi-hunt-all-animals-exception'
}
