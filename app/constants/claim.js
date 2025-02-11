export const claimConstants = {
  thresholdPerClaimType: {
    beef: 5,
    pigs: 30,
    sheep: 10
  },
  livestockTypes: {
    beef: 'beef',
    dairy: 'dairy',
    pigs: 'pigs',
    sheep: 'sheep'
  },
  claimType: {
    review: 'R',
    endemics: 'E',
    vetVisits: 'VV'
  },
  diseaseStatusTypes: {
    1: '1',
    2: '2',
    3: '3',
    4: '4'
  },
  vaccination: {
    vaccinated: 'vaccinated',
    notVaccinated: 'notVaccinated'
  },
  dateOfVetVisitExceptions: {
    rejectedReview: 'rejected review',
    endemicsWithin10: 'another endemics within 10 months',
    noReview: 'no review within 10 months past',
    reviewWithin10: 'another review within 10 months',
    claimEndemicsBeforeReviewPayment: 'claim endemics before review status is ready to pay'
  },
  amount: {
    R: {
      beef: '£522',
      dairy: '£372',
      pigs: '£684',
      sheep: '£436'
    },
    E: {
      beef: '£[amount]',
      dairy: '£[amount]',
      pigs: '£[amount]',
      sheep: '£[amount]'
    }
  }
}
