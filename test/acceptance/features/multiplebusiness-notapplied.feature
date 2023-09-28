@smoke1

Feature: Business Exceptions Validation- Multi Business exceptions - Not Applied


 Scenario: Apply with valid cred
     Given user is on the /claim landing page
    And user check the page title
    When user start the application
    When redirected to Defra ID page
    And user login with Exception-MB-NA business crn and password(for DefraId)
    Then user click on sign in button

Scenario Outline: org-review page
    When select the <business> for application
    When click on continue button
    Examples:
    |business|
    |Michael Dixon - SBI 114293653|

Scenario:Validate Exception Message for Claim- Multi Business exceptions - Not Applied
   When validate the error message in the Header
   And validate exception error message for MB-NOT Applied
   Then validate call charges screen
