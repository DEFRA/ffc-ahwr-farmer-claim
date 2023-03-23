window.onload = function () {
  const submitClaimForm = document.querySelector('#submitClaimForm')
  preventDuplicateFormSubmission(submitClaimForm)
}

function preventDuplicateFormSubmission (form) {
  form.addEventListener('submit', function (e) {
    if (form.dataset.formSubmitted) {
      e.preventDefault()
    } else {
      form.dataset.formSubmitted = true
    }
  })
}
