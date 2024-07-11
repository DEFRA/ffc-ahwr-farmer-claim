@smoke-reg
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
Then user continue to next page
Then validate the error for blank error message
When user enters the <species> name and <value>
Then clicked on continue button
Then click to continue the claim
Then validate the error message for blank input vet name screen
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
When user enter the rcvs number in endemics
Then clicked on continue button for endemics
Then click on the HerdVaccination postive
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
Then clicked on continue button for endemics
Then validate the sample error message
Then enter the incorrect no of pig samples that were tested
Then clicked on continue button for endemics
Then validate incorrect number of samples error message
Then click on the back button
Then enter the positive no of pig samples that were tested
Then clicked on continue button for endemics
Then click to continue the claim
Then validate disease status category not selected
Then click on the disease category
Then user continue to claim
Then user continue to claim
And validate that no options selected for assessment error message
Then click yes on biosecurity link
Then user continue to claim
Then validate no assessment percentage is entered
Then click no on biosecurity link
Then user continue to claim
Then validate you cannot continue to claim
Then click on the back button
Then click yes on biosecurity link
And Enter the percentage
Then user continue to claim
Then user confirm to be on check answer page
# Then user clicks on endemics claim submit


 Examples:
              |species|value|
              |Pigs | 57  | 