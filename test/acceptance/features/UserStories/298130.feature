@smoketest
Feature: Endemics Claim Journey

  Scenario: US-298130-1a-AC3-call charges link
   Given user is on the /claim/endemics landing page
   And user check the page title
   Then validate call charges screen
      
  Scenario: US-298130-1a-AC1-Start a claim from Claim guidance Screen
   And user check the page title
   When user clicks on Start now
   Then redirected to Defra ID page