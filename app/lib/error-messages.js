module.exports = {
  email: {
    enterEmail: 'Enter an email address',
    validEmail: 'Enter an email address in the correct format, like name@example.com'
  },
  name: {
    enterName: 'Enter the vet\'s name',
    nameLength: 'Name must be 50 characters or fewer',
    namePattern: "Special characters allowed include an ampersand(&), comma(,), hyphen(-), apostrophe('), space, brackets() or forward slash(/)"
  },
  urn: {
    enterUrn: 'Enter the URN',
    urnLength: 'URN must be 50 characters or fewer',
    urnPattern: 'Enter a valid URN'
  },
  rcvs: {
    enterRCVS: 'Enter the RCVS number',
    validRCVS: 'Enter a valid RCVS number'
  },
  visitDate: {
    startDateOrAfter: (createdAt) => `The date of review must be the same or after ${new Date(createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} when you accepted your agreement offer`,
    todayOrPast: 'The date the review was completed must be in the past'
  }
}
