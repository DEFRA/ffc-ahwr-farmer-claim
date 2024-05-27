@smoketest-verify
Feature:User Story 309188:Dev: [ 4a Beef/ Dairy Cattle and 6a Pig ] 'Confirm Bio security assessment' Screen for Endemics claim
Scenario Outline:AC2a Logics for unhappy path
        
        Then close browser
        Given user is on the /claim/endemics landing page
        When user clicks on Start now
        Then redirected to Defra ID page
        And user login with Pigs business crn and password(for DefraId)
        Then user click on sign in button
        And user confirm the org-review page
        And user agreed the business details is correct
        Then user continue to next page
        Then user clicks on Manage your claim
         Then click on Endemics disease follow up review
        Then clicked on continue button for endemics
        Then validate if the user landded on Date of Visit page
        Then user input the date in correct order
        Then clicked on continue button for endemics
         Then click on the option when vet visited the farm to carry out the review
        Then clicked on continue button for endemics
        Then user confirm to meet the requirement
        Then user continue to claim
        Then user enters the <LiveStock> name and <number>
        Then user continue to claim
        Then enter vet's full name
        Then user continue to next page
        Then user enter the rcvs number in endemics
        Then clicked on continue button for endemics
        Then click on the HerdVaccination postive
        Then clicked on continue button for endemics
        Then user input the test unique reference number in endemics
        Then clicked on continue button for endemics
         Then enter the positive no of pig samples that were tested
        Then clicked on continue button for endemics
        Then validate the disease status category
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
       Examples:
        |LiveStock|number|
        |  Pigs   |  60  | 