@smoke
Feature: claim journey landing page

  Scenario Outline: claim with invalid cred
    Given user is on the claim landing page
    And user check the page title
    When user start the application
    And user input <invalid email>
    Then an email error is displayed
    Examples:
      | invalid email   |
      | wrong@email     |