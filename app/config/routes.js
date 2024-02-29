const config = require('../config')

module.exports = {
  vetVisits: `${config.dashboardServiceUri}/vet-visits`,
  endemicsIndex: 'endemics',
  endemicsWhichSpecies: 'endemics/which-species',
  endemicsWhichTypeOfReview: 'endemics/which-type-of-review',
  endemicsYouCannotClaim: 'endemics/you-cannot-claim',
  endemicsDateOfVisit: 'endemics/date-of-visit',
  endemicsDateOfVisitException: 'endemics/date-of-visit-exception',
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
  endemicsNumberOfOralFluidSamplesException:
    'endemics/number-of-fluid-oral-samples-exception',
  endemicsTestResults: 'endemics/test-results',
  endemicsCheckAnswers: 'endemics/check-answers',
  endemicsConfirmation: 'endemics/confirmation',
  endemicsVaccination: 'endemics/vaccination',
  endemicsDiseaseStatus: 'endemics/disease-status',
  endemicsSheepEndemicsPackage: 'endemics/sheep-endemics-package',
  endemicsSheepEweTests: 'endemics/sheep/ewe',
  endemicsBiosecurity: 'endemics/biosecurity',
  endemicsNumberOfSpeciesSheepException: 'endemics/number-of-species-sheep-exception'
}
