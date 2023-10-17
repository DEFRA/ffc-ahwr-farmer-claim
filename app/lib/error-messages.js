module.exports = {
  email: {
    enterEmail: 'Enter an email address',
    validEmail: 'Enter an email address in the correct format, like name@example.com'
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
    enterRCVS: 'Enter the RCVS number',
    validRCVS: 'RCVS number must be 7 characters and only include letters a to z and numbers, like 1234567'
  },
  visitDate: {
    startDateOrAfter: (createdAt) => `The date of review must be the same or after ${new Date(createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} when you accepted your agreement offer`,
    todayOrPast: 'The date the review was completed must be in the past'
  }
}
