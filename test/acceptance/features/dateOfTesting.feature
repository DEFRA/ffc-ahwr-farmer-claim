@negative
Feature: claim journey landing page

  Scenario: claim with valid credentials
    Given user is on the /claim landing page
    And user check the page title
    When user start the application
    When redirected to Defra ID page
    When user input valid data
    Then user click on sign in button

  Scenario: user check all business details
    When the agreement number is shown
    When the business name is correct
    When user type of review is correct
    When user accept the displayed business details to be correct
    Then user continue to claim

Scenario: To validate the error "The date of testing must be in the past"
    Given user is on vet visit date page
    When asked about the date the review was completed
    When user input the date in correct order
    And enter the future date to check if the error message is displayed
    Then clicked on continue button
    Then validate the error message

Scenario: To validate the error "The date of testing should be from date of application or in the past"
    Given user is on vet visit date page
    When asked about the date the review was completed
    When user input the date in correct order
    And enter the past date to check if the error message is displayed
    Then clicked on continue button
    # Then validation of the error message
    