@smokereg1
Feature: Endemics -sheep- Regression 
Scenario Outline:To check that all the functionality is working fine
Given user is on the /claim landing page
When user clicks on Start now
Then redirected to Defra ID page
And user login with Single business crn and password(for DefraId)
Then user click on sign in button
And user confirm the org-review page
And user agreed the business details is correct
Then user continue to next page
Then user clicks on click for endemics follow-up
Then user clicks on Manage your claim
Then click on Endemics disease follow up review
Then clicked on continue button for endemics
Then user input the date in correct order
Then clicked on continue button for endemics
Then click on the option when vet visited the farm to carry out the review
Then clicked on continue button for endemics
Then user confirm to meet the requirement
Then user continue to claim
When user enters the <species> name and <value>
Then user continue to claim
When enter vet's full name
Then user continue to claim
When user enter the rcvs number in endemics
Then clicked on continue button for endemics
Then choose the sheep health package
Then clicked on continue button for endemics
Then choose What did the vet test or sample for 
Then clicked on continue button for endemics
Then choose What was the Sheep scab test result
Then clicked on continue button for endemics

  Examples:
      | LiveStockName |species|value|value|
      | Pigs          |Pigs   | 57  | 5   |