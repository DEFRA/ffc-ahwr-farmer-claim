const { livestockTypes: { beef, dairy, pigs, sheep }, claimType: { review, endemics } } = require('./claim')

const amounts = {
  beef: 522,
  dairy: 372,
  pigs: 684,
  sheep: 436
}

const thresholds = {
  minimumNumberFluidOralSamples: 5,
  positiveReviewNumberOfSamplesTested: '6',
  negativeReviewNumberOfSamplesTested: '30',
  numberOfSpeciesTested: {
    [beef]: {
      [review]: 5,
      [endemics]: 11
    },
    [dairy]: {
      [review]: 5,
      [endemics]: 1
    },
    [pigs]: {
      [review]: 30,
      [endemics]: 30
    },
    [sheep]: {
      [review]: 10,
      [endemics]: 1
    }
  }
}

module.exports = { amounts, thresholds }
