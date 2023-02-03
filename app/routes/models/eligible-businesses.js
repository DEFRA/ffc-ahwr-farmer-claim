const uniqueApplicationsForSbi = [
  {
    sbi: '122333',
    businessName: 'My farm',
    applications: [
      {
        reference: 'AHWR-5C1C-DD6A',
        status: 'AGREED',
        updatedAt: '2022-10-04 13:58:55'
      },
      {
        reference: 'AHWR-5C1C-DD6B',
        status: 'WITHDRAWN',
        updatedAt: '2022-10-05 13:58:55'
      },
      {
        reference: 'AHWR-5C1C-DD6C',
        status: 'AGREED',
        updatedAt: '2022-10-06 13:58:55'
      }
    ]
  },
  {
    sbi: '122334',
    businessName: 'My farm',
    applications: [
      {
        reference: 'AHWR-4FFF-1530',
        status: 'IN CHECK',
        updatedAt: '2022-10-06 13:58:55'
      }
    ]
  },
  {
    sbi: '122335',
    businessName: 'My farm',
    applications: [
      {
        reference: 'AHWR-4FFF-1531',
        status: 'AGREED',
        updatedAt: '2022-10-06 13:58:55'
      }
    ]
  }
]

function processEligibleBusinesses () {
  // todo get uniqueApplicationsForSbi from API
  const businesses = []
  uniqueApplicationsForSbi.forEach(applicationForSbi => {
    const applications = applicationForSbi.applications
    applications.sort(function (a, b) {
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
    const latestApplication = applications[0]
    if (latestApplication.status === 'AGREED') {
      console.log(`${new Date().toISOString()} Latest application is eligible to claim : ${JSON.stringify({
          sbi: applicationForSbi.sbi,
          businessName: applicationForSbi.businessName,
          ...latestApplication
        })}`)
      businesses.push({ sbi: applicationForSbi.sbi, businessName: applicationForSbi.businessName, reference: latestApplication.reference })
    } else {
      console.log(`${new Date().toISOString()} Latest application is not eligible to claim : ${JSON.stringify({
          sbi: applicationForSbi.sbi,
          businessName: applicationForSbi.businessName,
          ...latestApplication
        })}`)
    }
  })
  return businesses
}

module.exports = processEligibleBusinesses
