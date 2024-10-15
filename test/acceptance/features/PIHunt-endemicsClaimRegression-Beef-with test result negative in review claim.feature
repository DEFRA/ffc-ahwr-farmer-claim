@smoke-reg
Feature: Endemics -beef- Regression with Test result positive in review claim
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
Then click yes for PI Hunt
Then user continue to claim
Then click Yes for PI hunt recommended by vet
Then clicked on continue button for endemics
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
Then user clicks on endemics claim submit