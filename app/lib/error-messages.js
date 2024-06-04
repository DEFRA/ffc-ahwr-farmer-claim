module.exports = {
  email: {
    enterEmail: 'Enter an email address',
    validEmail: 'Enter an email address in the correct format, like name@example.com'
  },
  animalsTested: {
    enterNumber: 'Enter the number of animals tested',
    numberMax: 'The number of animals tested should not exceed 999999',
    numberPattern: 'Number of animals tested must only include numbers'
  },
  name: {
    enterName: 'Enter the vet\'s name',
    nameLength: "Vet's name must be 50 characters or fewer",
    namePattern: "Vet's name must only include letters a to z, numbers and special characters such as hyphens, spaces, apostrophes, ampersands, commas, brackets or a forward slash"
  },
  urn: {
    enterUrn: 'Enter the URN',
    urnLength: 'URN must be 50 characters or fewer',
    urnPattern: 'URN must only include letters a to z, numbers and a hyphen'
  },
  rcvs: {
    enterRCVS: 'Enter an RCVS number',
    validRCVS: 'RCVS number is a 7 digit number or a 6 digit number ending in a letter.'
  },
  visitDate: {
    startDateOrAfter: (createdAt) => `The date of review must be the same or after ${new Date(createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} when you accepted your agreement offer`,
    todayOrPast: 'The date the review was completed must be in the past'
  }
}
