@smoketest
Feature:299849-Dev- 4b Exception screen on Date of Vet visits for Review claim
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
   And click on AHWR link
   Then clicked on continue button for endemics
   Then validate if the user landded on Date of Visit page
   Then validate date of visit error message for agreementdateprior date format
   Then clicked on continue button for endemics
   Then validate you cannot continue to claim 
   Then click on ten month guidance link
   Then click on date of visit link
