module.exports = {
  email: {
    enterEmail: 'Enter an email address',
    validEmail: 'Enter an email address in the correct format, like name@example.com'
  },
  name: {
    enterName: 'Enter the vet\'s name',
    nameLength: 'Name must be 100 characters or fewer'
  },
  practice: {
    enterName: 'Enter the vet practice name',
    nameLength: 'Practice name must be 100 characters or fewer'
  },
  urn: {
    enterUrn: 'Enter the URN',
    urnLength: 'URN must be 100 characters or fewer'
  },
  rcvs: {
    enterRCVS: 'Enter the RCVS number',
    validRCVS: 'Enter a valid RCVS number'
  },
  visitDate: {
    emptyValues: (val1, val2) => `Date must include a ${val1}${val2 ? ' and a ' + val2 : ''}`,
    enterDate: 'Enter a date',
    enterDateInTheCorrectFormat: 'Enter a date in the correct format',
    realDate: 'Date must be a real date',
    startDateOrAfter: (createdAt) => `Date must be the same or after ${new Date(createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} when you accepted your agreement offer`,
    todayOrPast: 'The date the review was completed must be in the past',
    shouldBeLessThan6MonthAfterAgreement: 'The date the review was completed must be within six months of agreement date.'
  }
}
