@smoketest
Feature:Dev:10-'Claim submission confirmaytion' Screen
Scenario Outline:Dev:10-'Claim submission confirmation' Screen
 Given user is on the /claim/endemics landing page
   When user clicks on Start now
   Then redirected to Defra ID page
   And user login with Single business crn and password(for DefraId)
   Then user click on sign in button
   And user confirm the org-review page
   And user agreed the business details is correct
   Then user continue to next page
   Then user clicks on Manage your claim
   And user choose <LiveStockName> cattle for review
   Then user continue to next page
   When user input the date in correct order
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
    When user input the test unique reference number in endemics
    Then clicked on continue button for endemics
    And user validate the header of the page of OralSamples
    When user enters the no of samples <samplevalue>
   Then click to oral samples continue the claim
   Then clicked on continue button for endemics
   Then validate the test results error message
   Then click on the positive test results
   Then clicked on continue button for endemics
   Given user confirm to be on check answer page
   Then user clicks on endemics claim submit
   Then Validate if Agreement is generated
   Then Validate if amount is displayed
   Then check Guidance click
   Then check Manage your claims
  
    Examples:
      | LiveStockName |species|value|samplevalue|
      | Pigs          |Pigs   | 57  | 5   |