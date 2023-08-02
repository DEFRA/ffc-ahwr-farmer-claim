@smoke
Feature: claim journey landing page

  Scenario: claim with valid credentials
    Given user is on the /claim landing page
    And user check the page title
    When user start the application
    When redirected to Defra ID page
    When user input valid data
    Then user click on sign in button

  Scenario: user check all business details
    Given user confirm to be on business page
    When the agreement number is shown
    When the business name is correct
    When user type of review is correct
    When user accept the displayed business details to be correct
    Then user continue to claim

  Scenario: farmer input the date of the last visit to the farm for review
    Given user is on vet visit date page
    When asked about the date the review was completed
    When user input the date in correct order
    And click on the option when vet visited the farm to carry out the review
    #Then clicked on continue button

    Scenario: farmer input the date of the last visit to the farm for review as different date
    Given user is on vet visit date page
    When asked about the date the review was completed
    When user input the date in correct order
    And click on another date
    Then clicked on continue button



  # Scenario: identifying the vet full name
  #   Given user is on vet name page
  #   When check the question on the page
  #   When enter vet's full name
  #   Then click to continue the claim

  # Scenario: Farmer input the vet's Royal college of veterinary surgeons (RCVS) number
  #   Given user navigate to vet rcvs page
  #   When user read the question
  #   When user enter the rcvs number
  #   Then proceed to next page

  # Scenario: test result unique reference number
  #   Given user is on urn result page
  #   When check what's required
  #   When user input the test unique reference number
  #   Then proceed to next page

  # Scenario: check all answer provided by the farmer is correct and match the business details
  #   Given user confirm to be on check answer page
  #   When user is required to go through the answer provided
  #   When confirm the business name to be true
  #   When correct sbi number is displayed
  #   When confirm to have the minimum require livestock for the review
  #   Then continue to next page

  # Scenario: submit the claim after confirming the information provided is correct
  #   Given user is on the final page
  #   When user check the information displayed
#    Then user submit the claim
#
#  Scenario: agreement number is displayed after completing the claim
#    When user is on submit claim page
#    When User complete the claim
#    When success message is displayed
#    Then the agreement number is presented







