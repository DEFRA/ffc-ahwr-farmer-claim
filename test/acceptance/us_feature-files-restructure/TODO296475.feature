@smoketest
Feature:304031-Dairy Cattle-Confirm Endemics test results' Screen for Endemics claim
    Scenario Outline:AC2 Inline Exceptions on the screen when no input is provided 
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
        Then user input the test unique reference number in endemics
        Then clicked on continue button for endemics
        Then clicked on continue button for endemics
        Then validate the results exception error message
        Examples:
        |LiveStock|number|
        |  Beef  |  10  |

        Scenario:AC1 Logics for input in this screen
        Then click on the positive test results
        Then clicked on continue button for endemics
        Then clicked on back button biosecurity page

        Scenario:AC3 'Back link' functionality on the page
        Then click on the back button
        Then user is on urn result page of endemics