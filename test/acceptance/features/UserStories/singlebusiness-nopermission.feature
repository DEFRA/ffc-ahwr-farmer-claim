
@smoke
Feature: Business Exceptions

  Scenario: single business exception-No Permission
    Given user is on the /claim landing page
    And user check the page title
    When user start the application
    When redirected to Defra ID page
    And user login with Exception-SB-NP business crn and password(for DefraId)
    Then user click on sign in button

Scenario:Validate Exception Message for Apply - Single Business exceptions - No Permission
   When validate the error message in the Header
   And validate exception error message for SB-NO Permission
   Then validate call charges screen