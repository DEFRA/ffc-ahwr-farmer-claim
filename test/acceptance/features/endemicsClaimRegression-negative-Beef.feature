@smoke-reg1
Feature: Endemics -Negative-Beef- Regression 
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
Then clicked on continue button for endemics
Then validate the error message for no review selected
Then click on Endemics disease follow up review
Then clicked on continue button for endemics
# date of follow up screen
When user input the date in invalid order
Then clicked on continue button for endemics
When validation of error message for invalid date format for Date errors
Then user input the date in correct order
Then clicked on continue button for endemics
Then clicked on continue button for endemics
Then validate the Date of testing cannot be blank
Then click on another date which is earlier than review date
Then clicked on continue button for endemics
Then validate the Date of testing cannot be before the review visit date
Then click on the option when vet visited the farm to carry out the review
Then clicked on continue button for endemics
Then user doesnt confirm to meet the requirement
Then user continue to next page
Then validate incorrect number of samples error message
Then click on the back button
Then user confirm to meet the requirement
Then user continue to next page
Then clicked on continue button
Then click to continue the claim
Then validate the error message for blank input vet name screen
When enter vet's full name
Then click to continue the claim
Then user enter the rcvs number with more characters in endemics
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
Then user continue to claim
Then validate the error if PI is not selected
Then click yes for PI Hunt
Then user continue to claim
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
              |species|value|
              |Beef   |12   | 
