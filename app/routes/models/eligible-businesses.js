const latestApplicationForSbi = [
  {
    id: '48d2f147-614e-40df-9ba8-9961e7974e83',
    reference: 'AHWR-48D2-F147',
    data: {
      reference: null,
      declaration: true,
      offerStatus: 'accepted',
      whichReview: 'sheep',
      organisation: {
        crn: '112222',
        sbi: '122333',
        name: 'My Amazing Farm',
        email: 'liam.wilson@kainos.com',
        address: '1 Some Road',
        farmerName: 'Mr Farmer'
      },
      eligibleSpecies: 'yes',
      confirmCheckDetails: 'yes'
    },
    claimed: false,
    createdAt: '2023-02-01T13: 52: 14.176Z',
    updatedAt: '2023-02-01T13: 52: 14.207Z',
    createdBy: 'admin',
    updatedBy: null,
    statusId: 1
  },
  {
    id: '48d2f147-614e-40df-9ba8-9961e7974e82',
    reference: 'AHWR-48D2-F148',
    data: {
      reference: null,
      declaration: true,
      offerStatus: 'accepted',
      whichReview: 'pigs',
      organisation: {
        crn: '112222',
        sbi: '123456789',
        name: 'My Beautiful Farm',
        email: 'liam.wilson@kainos.com',
        address: '1 Some Road',
        farmerName: 'Mr Farmer'
      },
      eligibleSpecies: 'yes',
      confirmCheckDetails: 'yes'
    },
    claimed: false,
    createdAt: '2023-02-01T13: 52: 14.176Z',
    updatedAt: '2023-02-01T13: 52: 14.207Z',
    createdBy: 'admin',
    updatedBy: null,
    statusId: 1
  }
]

function processEligibleBusinesses () {
  // todo get uniqueApplicationsForSbi from API
  const businesses = []
  latestApplicationForSbi.forEach(latestApplication => {
    if (latestApplication.statusId === 1) {
      console.log(`${new Date().toISOString()} Latest application is eligible to claim : ${JSON.stringify({
          sbi: latestApplication.data.organisation.sbi
        })}`)
      businesses.push(latestApplication)
    } else {
      console.log(`${new Date().toISOString()} Latest application is not eligible to claim : ${JSON.stringify({
          sbi: latestApplication.data.organisation.sbi
      })}`)
    }
  })
  return businesses
}

module.exports = processEligibleBusinesses
