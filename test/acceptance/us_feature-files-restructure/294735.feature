@smoketest
Feature: Dev: 6a 'Number of animals tested' Screen for review claim
Scenario Outline:Validation for pigs
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
    Then validate pigs error message

    Examples:
      | LiveStockName |species|value|
      | Pigs          |Pigs   | 5 |

   Scenario Outline:Validation for beef
   Given user is on the /claim/endemics landing page
   When user clicks on Start now
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
    Then validate beef error message 

      Examples:
      | LiveStockName |species|value|
      | Beef        |Beef | 3 | 

Scenario Outline:Validation for sheep
   Given user is on the /claim/endemics landing page
   When user clicks on Start now
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
    Then validate sheep error message

      Examples:
      | LiveStockName |species|value|
      | Sheep        |Sheep | 5 |       

Scenario Outline:Validation for sheep
   Given user is on the /claim/endemics landing page
   When user clicks on Start now
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
    Then validate blank error message

      Examples:
      | LiveStockName |species|value|
      | Sheep        |Sheep |  |             