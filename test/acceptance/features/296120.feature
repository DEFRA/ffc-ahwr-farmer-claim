@smoketest

Feature:Dev: 4c 'Date of testing' Screen

Scenario: AC1 Content on the exception screen 
   Given user is on the /claim/endemics landing page
   When user clicks on Start now
   Then redirected to Defra ID page
   And user login with Single business crn and password(for DefraId)
   Then user click on sign in button
   # check-detail page content development in progress
   When user check the business details
   And user confirm the org-review page
   And user agreed the business details is correct
   Then user continue to next page
   Then user clicks on Manage your claim 
   And user choose <LiveStockName> cattle for review
   Then user continue to next page
   #Given user is on vet visit date page
   #When asked about the date the review was completed
   When user input the date in correct order
   #And click on the option when vet visited the farm to carry out the review
   Then clicked on continue button for endemics
    Examples:
      | LiveStockName |
      | Pigs          |

   Scenario:AC4 Inline error on the screen when no option is selected
   Then clicked on continue button for endemics
   Then validate the no option selected error message for date of testing

   Scenario:AC 1 Date of testing - Option 1 When the vet visited the farm for the review
   And click on the option when vet visited the farm to carry out the review
   Then clicked on continue button for endemics
   Then click on the back button

    Scenario: AC2 Date of testing - Option 2 On another date
   Then click on another date
   Then clicked on continue button for endemics
   Then click on the back button

   Scenario:AC3 Exceptions when date of testing is earlier than date of vet visit
   Then click on another date which is earlier than review date
   Then clicked on continue button for endemics
   Then validate the Date of testing cannot be before the review visit date

    Scenario:AC6 'Back link' functionality on the page
    # Then click on the back button

    Scenario Outline:AC5 Inline error on the screen when no data is entered or invalid data is entered
    When farmer input missing <day> or <month> or <year> for samples taken
    Then clicked on continue button for endemics
    Then validate the Date of testing cannot be blank for another date
    Examples:
    | day | month | year |
    |     |       |      |

    Scenario Outline:AC5 Inline error on the screen when no data is entered or invalid data is entered
    When farmer input missing <day> or <month> or <year> for samples taken
    Then clicked on continue button for endemics
    Then validate that date is missing for data of visit in endemics
    Examples:
    | day | month | year |
    |     |   02  | 2024 |

    Scenario Outline:AC5 Inline error on the screen when no data is entered or invalid data is entered
    When farmer input missing <day> or <month> or <year> for samples taken
    Then clicked on continue button for endemics
    Then validate that month is missing for data of visit in endemics
    Examples:
    | day | month | year |
    |  04   |     | 2024 |

      Scenario Outline:AC5 Inline error on the screen when no data is entered or invalid data is entered
    When farmer input missing <day> or <month> or <year> for samples taken
    Then clicked on continue button for endemics
    Then validate that year is missing for data of visit in endemics
    Examples:
    | day | month | year |
    |  04 |   02  |      |
