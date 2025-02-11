export const getLatestApplication = (applications) => {
  return applications.reduce((a, b) => {
    return new Date(a.createdAt) > new Date(b.createdAt) ? a : b
  }, {})
}
