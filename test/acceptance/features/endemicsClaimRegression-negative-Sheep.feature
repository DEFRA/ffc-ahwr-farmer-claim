@smoke-reg
Feature: Endemics - Negative -Sheep- Regression 
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
Then clicked on continue button for endemics
Then validate select a package error
Then choose the sheep health package
Then clicked on continue button for endemics
Then clicked on continue button for endemics
Then validate vet test error
Then choose What did the vet test or sample for 
Then clicked on continue button for endemics
Then clicked on continue button for endemics
Then validate no result is selected
Then choose What was the Sheep scab test result
Then clicked on continue button for endemics

    Examples:
              |species|value|
              |Sheep  |20  | 