@smoke
Feature: claim journey landing page

  Scenario: claim with invalid credentials
    Given user is on the /claim landing page
    And user check the page title
    When user start the application
    When redirected to Defra ID page
    When user input invalid crn
    When user typed in invalid password
    Then user click on sign in button
    Then error message is displayed on the screen

  Scenario: claim with valid credentials
    Given user is on the /claim landing page
    And user check the page title
    When user start the application
    When redirected to Defra ID page
    When user input valid data
    Then user click on sign in button






