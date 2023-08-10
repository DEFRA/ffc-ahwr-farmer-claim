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

 Scenario Outline: To validate the error "Date of review must include a day and a year"

    When asked about the date the review was completed
    When user input missing <day> or <month> or <year>
    Then clicked on continue button
    Then validation of error message Date of review must include a day and a year
    Then click on the back button
    Then user continue to claim
Examples:
    | day | month | year |
    |     | 08    |      |

 Scenario Outline: To validate the error "Date of review must include a day and a month"


    When asked about the date the review was completed
    When user input missing <day> or <month> or <year>
    Then clicked on continue button
    Then validation of error message Date of review must include a day and a month
    Then click on the back button
    Then user continue to claim
Examples:
    | day | month | year |
    |     |     |  2023  |

 Scenario Outline: To validate the error "Date of review must include a day and a month"

    When asked about the date the review was completed
    When user input missing <day> or <month> or <year>
    Then clicked on continue button
    Then validation of error message Date of review must include a month and a year
    Then click on the back button
    Then user continue to claim
    Examples:
    | day | month | year |
    |  01   |     |    |

Scenario Outline: To validate the error "Date of review must include a month"


    When asked about the date the review was completed
    When user input missing <day> or <month> or <year>
    Then clicked on continue button
    Then validation of error message Date of review must include a month
    Then click on the back button
    Then user continue to claim
    Examples:
    | day | month | year |
    |  01   |     | 2023   |

Scenario Outline: To validate the error "Date of review must include a year"

    When asked about the date the review was completed
    When user input missing <day> or <month> or <year>
    Then clicked on continue button
    Then validation of error message Date of review must include a year
    Then click on the back button
    Then user continue to claim
    Examples:
    | day | month | year |
    |  01   |  08   |     |    

Scenario Outline: To validate the error "Date of review must include a date"


    When asked about the date the review was completed
    When user input missing <day> or <month> or <year>
    Then clicked on continue button
    Then validation of error message Date of review must include a date
    Then click on the back button
    Then user continue to claim
    Examples:
    | day | month | year |
    |     |  08   | 2023 |      


  Scenario: To validate the error "The date of testing must be in the past" when On another day is clicked
#     Given user is on vet visit date page
    When asked about the date the review was completed
    When user input the date in correct order
    And enter the future date to check if the error message is displayed
    Then clicked on continue button
    Then validate the error message

 Scenario: To validate the error "The date of testing should be from date of application or in the past" when On another day is clicked
    # Given user is on vet visit date page
    When asked about the date the review was completed
    When user input the date in correct order
    And enter the prior date to check if the error message is displayed
    Then clicked on continue button
    Then validation of the error message