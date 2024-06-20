@smoketest
Feature:313105-Dev: 5b  [Sheep] Exception screen for How many animals did the Vet Test
    Scenario Outline:AC1 Content on the exception screen
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
        Then validate sheep error message
        Examples:
        |LiveStock|number|
        |  Sheep  |  5   |

        Scenario Outline:AC2 Functionality of links on this screen
        Then click on the enter the animal tested
        Then user enters the <LiveStock> name and <number>
         Then user continue to claim
        Then click on the continue with your claim
        Examples:
        |LiveStock|number|
        |  Sheep  |  5    |