@smoke-reg
Feature: Review Claim-Dairy-Regression 
Scenario Outline:To check that all the functionality is working fine
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
When enter vet's full name
Then click to continue the claim
When user enter the rcvs number in endemics
Then clicked on continue button for endemics
When user input the test unique reference number in endemics
Then clicked on continue button for endemics
Then click on the positive test results
Then clicked on continue button for endemics
Given user confirm to be on check answer page
Then user clicks on endemics claim submit
# code for connecting database
# Then fetch the claim number
# Move the incheck to Ready to pay Status
# Then pass the claim number to ReadyToPay
 
  
    Examples:
      | LiveStockName | species|
      | Dairy         | Dairy  |