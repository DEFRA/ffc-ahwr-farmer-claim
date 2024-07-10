@smoketest
Feature: Dev: Change your business from 'Manage your claims' screen
Scenario: US-294877-AC1 Logic for Single SBI case
 Given user is on the /claim/endemics landing page
   When user clicks on Start now
   Then redirected to Defra ID page
   And user login with Single business crn and password(for DefraId)
   Then user click on sign in button
   #When user check the business details
   And user confirm the org-review page
   And user agreed the business details is correct
   Then user continue to next page
   Then user clicks on Manage your claim 
 
Scenario Outline:AC2 Logic for High Multi and Mid multi SBI case
 
 Then close browser
 Given user is on the /claim/endemics landing page
 When user clicks on Start now
 Then redirected to Defra ID page
 And user login with Multiple business crn and password(for DefraId)
 Then user click on sign in button
 When select the <business> for application
 When click on continue button
    Examples:
    |business|
    |Long Close - SBI 106581532|