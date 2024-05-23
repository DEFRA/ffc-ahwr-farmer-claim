@smokereg1
Feature: Review Claim- Regression 
Scenario Outline:To check that all the functionality is working fine
Given user is on the /claim landing page
When user clicks on Start now
Then redirected to Defra ID page
And user login with Single business crn and password(for DefraId)
Then user click on sign in button
And user confirm the org-review page
And user agreed the business details is correct
Then user continue to next page
Then user clicks on Manage your claim
And user choose <LiveStockName> cattle for review
When user continue to next page
#Feature: Date of Visit validations
When user input the date in invalid order
Then clicked on continue button for endemics
When validation of error message for invalid date format for Date errors
When user input the date in correct order
Then clicked on continue button for endemics
#Feature: Date of testing validations
Then validation of error message for blank date format for Enter the date of vet testing
Then clicked on continue button for endemics
Then validate the Date of testing cannot be blank for another date
And click on the option when vet visited the farm to carry out the review
Then clicked on continue button for endemics
Then user doesnt confirm to meet the requirement
Then user continue to next page
Then validate the ypu cannot continue to claim
Then click on change your answers
And user confirm to meet the requirement
Then user continue to next page
#Feature:How many animals did the vet test
Then clicked on continue button
Then validate the enter the no of animals tested link in exception screen
When user enters the <species> name and <value>
Then clicked on continue button
# Feature:vet name validation 
Then click to continue the claim
Then validate the error message for blank input vet name screen
When enter vet's full name
Then click to continue the claim
# Feature:RCVS number validation 
When user enter the rcvs number with more characters in endemics
Then clicked on continue button for endemics
Then Validation of RCVS error message for endemics
When user enter the rcvs number with less characters in endemics
Then clicked on continue button for endemics
Then Validation of RCVS error message for endemics
When user enter the rcvs number with special characters in endemics
Then clicked on continue button for endemics
Then Validation of RCVS error message for endemics
When user enter the rcvs number in endemics
Then clicked on continue button for endemics
# Feature:URN Validation
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
# Feature:Oral Sample Validation
And user validate the header of the page of OralSamples
Then click to oral samples continue the claim
When validate the error message for blank input oral samples screen
When user enters the no of samples <incorrectvalue>
Then click to oral samples continue the claim
Then validate the exception for oral samples screen
Then click on the back button
When user enters the no of samples <value>
Then click to oral samples continue the claim
Then clicked on continue button for endemics
Then validate the test results error message
Then click on the positive test results
Then clicked on continue button for endemics
Given user confirm to be on check answer page
Then user clicks on endemics claim submit
 
  
    Examples:
      | LiveStockName |species|value|incorrectvalue|value|
      | Pigs          |Pigs   | 57  |       2      |  5  |
      
