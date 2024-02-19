@smoketest1
Feature: Endemics Claim Journey-'Your Vet's name' Screen

Scenario: US-294860-AC1 Logics for input in this screen
   Given user is on the /claim/endemics landing page
   When user clicks on Start now
   Then redirected to Defra ID page
   And user login with Single business crn and password(for DefraId)
   Then user click on sign in button
   # check-detail page content development in progress
   When user check the business details
   And user confirm the org-review page
   And user agreed the business details is correct
   Then user continue to next page
   Given user is on the /claim/endemics/vet-name landing page
   When check the question on the page
   When enter vet's full name
   Then click to continue the claim
   Then user navigate to vet rcvs page

Scenario: US-294860-AC2 Inline Exceptions on the screen when no input is provided
   Given user is on vet name page
   Then clicked on continue button
   Then validate the error message for blank input
   Then validate the error message for blank input vet name screen
      
Scenario:US-294860-AC3 Field validations for input
   
   Given user is on vet name page
   Then enter the name with more than 50 characters
   Then clicked on continue button
   Then validation for more characters in vets visits name
   Then validation of special characters in the vets visits name
   Then clicked on continue button
   Then validation of error message for special characters in the vets visits name
   Then clicked on continue button

Scenario:US-294860-AC4 'Back link' functionality on the page
   When enter vet's full name
   Then click to continue the claim
   Then user navigate to vet rcvs page
   Then click on the back link


   



