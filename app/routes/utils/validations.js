export const addError = (error, label, type, href) => {
  if (
    error.details
      .filter(e => e.context.label.startsWith(label))
      .filter(e => e.type.indexOf(type) !== -1)
      .length
  ) {
    error.details = error.details
      .filter(e => !e.context.label.startsWith(label) || e.type.indexOf(type) !== -1)
  }
  if (error.details.filter(e => e.context.label.startsWith(label)).length) {
    return {
      text: error.details.find(e => e.context.label.startsWith(label)).message,
      href
    }
  }
  return {}
}
