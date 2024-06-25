@smoketest
Feature:309198-Dev-4a Pig endemics claim] Confirm number of samples tested screen
    Scenario Outline:AC1 Logics for input in this screen
        Given user is on the /claim/endemics landing page
        When user clicks on Start now
        Then redirected to Defra ID page
        And user login with Single business crn and password(for DefraId)
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
        
         Examples:
        |LiveStock|number|
        |  Pigs  |  60  | 
        Scenario: AC2 Inline Exceptions on the screen 
        Then clicked on continue button for endemics
        Then validate the sample error message
        Then enter the incorrect no of pig samples that were tested
        Then clicked on continue button for endemics
        Then validate incorrect number of samples error message
        
        Scenario: AC4 'Back link' functionality on the page
        Then click on the back button
        Then enter the positive no of pig samples that were tested
        Then clicked on continue button for endemics
        Then validate the disease status category


