@smoketest
Feature:294630-Dev: 4a 'Date of Vet visits' Screen

Scenario:AC1 Enter the Date of vet visit 
 Given user is on the /claim/endemics landing page
   When user clicks on Start now
   Then redirected to Defra ID page
   And user login with Single business crn and password(for DefraId)
   Then user click on sign in button
   And user confirm the org-review page
   And user agreed the business details is correct
   Then user continue to next page
   Then user clicks on Manage your claim
   Then click on Endemics disease follow up review
   Then clicked on continue button for endemics
   Then validate if the user landded on Date of Visit page
   Scenario: AC3 Inline error when the user has not entered any value
   Then clicked on continue button for endemics
   Then validate date of visit error message for blank date format
   When user input the date in dateisblank order
   Then clicked on continue button for endemics
   Then validate date of visit error message for dateisblank date format
   When user input the date in incorrect order
   Then clicked on continue button for endemics
   Then validate date of visit error message for incorrect date format
   When user input the date in monthisblank order
   Then clicked on continue button for endemics
   Then validate date of visit error message for monthisblank date format
   When user input the date in yearisblank order
   Then clicked on continue button for endemics
   Then validate date of visit error message for yearisblank date format
   When user input the date in dateisblank order
   Then clicked on continue button for endemics
   Then validate date of visit error message for dateisblank date 
   Scenario: AC2 Exceptions when the review vet visit date doesn't have 10 month gap between the last one
   When user input the date in agreementdateprior order
   Then clicked on continue button for endemics
   Then validate date of visit error message for agreementdateprior date 
   Scenario: AC4 'Back link' functionality on the page
   Then click on the back button
   Then validate type of review header

  