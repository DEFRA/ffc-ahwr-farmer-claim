@smoketest
Feature: Dev: 8b Laboratory URN Screen
Scenario Outline: US-294895-AC1 Content on the exception screen
 Given user is on the /claim/endemics landing page
   When user clicks on Start now
   Then redirected to Defra ID page
   And user login with Single business crn and password(for DefraId)
   Then user click on sign in button
   When user check the business details
   And user confirm the org-review page
   And user agreed the business details is correct
   Then user continue to next page
   Then user clicks on Manage your claim 
    And user choose <LiveStockName> cattle for review
     Then user continue to next page
    #Given user is on vet visit date page
   #  When asked about the date the review was completed
    When user input the date in correct order
   #  And click on the option when vet visited the farm to carry out the review
    Then clicked on continue button for endemics
    And click on the option when vet visited the farm to carry out the review
    Then clicked on continue button for endemics
    And user confirm to meet the requirement
    Then user continue to next page
    When user enters the <species> name and <value>
    Then clicked on continue button
    When enter vet's full name
    Then click to continue the claim
    When user enter the rcvs number in endemics
    Then clicked on continue button for endemics
    When Enter URN field for endemics with 50 characters
    Then clicked on continue button for endemics
    Then Endemics validation of URN error message for 50 characters
    When Enter URN field for endemics with special characters for endemics
    Then clicked on continue button for endemics
    Then Endemics validation of URN error message for special characters
    When Enter URN field for endemics with empty for endemics
    Then clicked on continue button for endemics
    Then Endemics validation of URN error message for empty characters 
    When user input the test unique reference number in endemics
    Then clicked on continue button for endemics

    
    Examples:
      | LiveStockName |species|value|
      | Pigs          |Pigs   | 57  |