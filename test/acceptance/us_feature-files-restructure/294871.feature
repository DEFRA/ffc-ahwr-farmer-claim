@smoketest
Feature: Endemics Claim Journey-'Your Vet's name' Screen

Scenario Outline: AC1 Logics for input in this screen

    Given user is on the /claim/endemics landing page
    Given user is on the /vet-visits landing page
     When user clicks on Start now
   Then redirected to Defra ID page
   And user login with Single business crn and password(for DefraId)
   Then user click on sign in button
   #When user check the business details
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
    When user enter the rcvs number with more characters in endemics
   Then clicked on continue button for endemics
    Then Validation of RCVS error message for endemics
   When user enter the rcvs number with less characters in endemics
   Then clicked on continue button for endemics
   Then Validation of RCVS error message for endemics
   When user enter the rcvs number with special characters in endemics
   Then clicked on continue button for endemics
    Then Validation of RCVS error message for endemics
    Then clicked on continue button for endemics
     When user enter the rcvs number in endemics
    Then clicked on continue button for endemics

        Examples:
      | LiveStockName |species|value|
      | Pigs          |Pigs   | 57  |

   

