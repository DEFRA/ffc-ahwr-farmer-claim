export class NoApplicationFoundError extends Error {
  constructor (message, organisation) {
    super(message)
    this.name = 'NoApplicationFoundError'
    this.organisation = organisation
  }
}
