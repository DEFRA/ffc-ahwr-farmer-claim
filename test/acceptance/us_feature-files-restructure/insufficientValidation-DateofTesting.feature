@negative
Feature: claim journey landing page

  Scenario: claim with valid credentials
    Given user is on the /claim landing page
    And user check the page title
    When user start the application
    When redirected to Defra ID page
     And user login with Single business crn and password(for DefraId)
    Then user click on sign in button

  Scenario: user check all business details
    When the agreement number is shown
    When the business name is correct
    When user type of review is correct
    When user accept the displayed business details to be correct
    Then user continue to claim
 

  Scenario: To validate the error "Enter the date the vet completed the review" and "Select if testing was carried out when the vet visited the farm or on another date"
   Given user is on vet visit date page
    When asked about the date the review was completed
    Then clicked on continue button
    Then validation of Error
    Then click on the back button
    Then user continue to claim

Scenario: To validate the error in review completed "Date of review must be a real date"
  
    When asked about the date the review was completed
    When user input the date in invalid order
    Then clicked on continue button
    Then validation of invalid error message
    Then click on the back button
    Then user continue to claim

 Scenario Outline: To validate the error "Date of review must be a real date"

    When asked about the date the review was completed
    When user input missing <day> or <month> or <year>
    Then clicked on continue button
    Then validation of error message Date of review must be a real date
    Then click on the back button
    Then user continue to claim
Examples:
    | day | month | year |
    | 0   |   7   | 2023 |

    Scenario Outline: To validate the error "Date of review must be a real date"

    When asked about the date the review was completed
    When user input missing <day> or <month> or <year>
    Then clicked on continue button
    Then validation of error message Date of review must be a real date
    Then click on the back button
    Then user continue to claim
Examples:
    | day | month | year |
    | 32  |   7   | 2023 |

    Scenario Outline: To validate the error "Date of review must be a real date"

    When asked about the date the review was completed
    When user input missing <day> or <month> or <year>
    Then clicked on continue button
    Then validation of error message Date of review must be a real date
    Then click on the back button
    Then user continue to claim
Examples:
    | day | month | year |
    | 7   |   0   | 2023 |

    Scenario Outline:  To validate the error message "Vet's name must be 50 characters or less"

    Given user is on vet visit date page
    When asked about the date the review was completed
    When user input the date in correct order
    And click on the option when vet visited the farm to carry out the review
    Then clicked on continue button

  
 Scenario Outline: Scenario Outline name: identifying the vet full name
    When user enters the <species> name and <value>
    Then click to continue the claim
   
    Examples:
    |species|value|
    |Sheep| 12|

  Scenario: " Vet's name error validation"
   
   Given user is on vet name page
   Then enter the name with more than 50 characters
   Then clicked on continue button
   Then validation for more characters in vets visits name
   Then validation of special characters in the vets visits name
   Then clicked on continue button
   Then validation of error message for special characters in the vets visits name
    Then clicked on continue button
     When enter vet's full name
     Then clicked on continue button

  Scenario: "Validate RCVS error "
  
   When user enter the rcvs number with more characters
   Then proceed to next page
    Then Validation of RCVS error message
   When user enter the rcvs number with less characters
   Then proceed to next page
    Then Validation of RCVS error message
   When user enter the rcvs number with special characters
   Then proceed to next page
    Then Validation of RCVS error message
    Then proceed to next page
      When user enter the rcvs number
    Then proceed to next page

  Scenario:"Validate URN error "

  When Enter URN field with 50 characters
   Then proceed to next page
  Then Validation of URN error message for 50 characters
  When Enter URN field with special characters 
   Then proceed to next page
  Then Validation of URN error message for special characters 
  When Enter URN field with empty
  Then Validation of URN error message for empty characters
   Then proceed to next page