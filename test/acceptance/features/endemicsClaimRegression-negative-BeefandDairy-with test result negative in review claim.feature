@smoke-reg
Feature: Endemics-negative scenarios -beef&cattle- Regression with Test result negative in review claim
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
Then user input the date in correct order
Then clicked on continue button for endemics
Then user confirm to meet the requirement
Then user continue to claim
When enter vet's full name
Then user continue to claim
When user enter the rcvs number in endemics
Then clicked on continue button for endemics
Then validate PI Hunt page
Then click no for PI Hunt
Then user continue to claim
Then click yes on biosecurity link
Then user continue to claim
Given user confirm to be on check answer page
Then click on the back button
Then click Back link on Biosecurity Page
Then click yes for PI Hunt
Then user continue to claim
Then click No for PI hunt recommended by vet
Then clicked on continue button for endemics
Then click on Change your answer if the vet asked for a PI hunt
Then click Yes for PI hunt recommended by vet
Then clicked on continue button for endemics
Then click no for beef catle in the herd
Then clicked on continue button for endemics
Then validate the error message There could be a problem with your claim
Then click Change your answer if the PI hunt was done on all beef cattle in the herd
Then click yes for beef catle in the herd
Then clicked on continue button for endemics
Then click on the option when vet visited the farm to carry out the review
Then clicked on continue button for endemics
When user input the test unique reference number in endemics
Then clicked on continue button for endemics
Then click on the positive test results
Then clicked on continue button for endemics
Then click yes on biosecurity link
Then user continue to claim
Given user confirm to be on check answer page