const amounts = {
  beef: 522,
  dairy: 372,
  pigs: 684,
  sheep: 436
}

const thresholds = {
  minimumNumberFluidOralSamples: 5,
  minimumNumberOFBeefTested: 5,
  minimumNumberOFPigsTested: 30,
  minimumNumberOFSheepTested: 10,
  positiveReviewNumberOfSamplesTested: 6,
  negativeReviewNumberOfSamplesTested: 30
}

module.exports = { amounts, thresholds }
