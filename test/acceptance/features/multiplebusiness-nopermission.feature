@smoke1

Feature: Business Exceptions Validation- Multi Business exceptions - No Permissison


 Scenario: Apply with valid cred
     Given user is on the /claim landing page
    And user check the page title
    When user start the application
    When redirected to Defra ID page
    And user login with Exception-MB-NP business crn and password(for DefraId)
    Then user click on sign in button

Scenario Outline: org-review page
    When select the <business> for application
    When click on continue button
    Examples:
    |business|
    |Lonsdale Health - SBI 106240540|

Scenario:Validate Exception Message for Apply - Multi Business exceptions - No CPH
   When validate the error message in the Header
   And validate exception error message for MB-NO Permission
   Then validate call charges screen
