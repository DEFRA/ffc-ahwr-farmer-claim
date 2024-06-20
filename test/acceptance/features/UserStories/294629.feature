@smoketest
Feature:294629-Dev: 3 'Which type of review are you claiming for' Screen
    Scenario:AC1-Display the species selected in the question
        Given user is on the /claim/endemics landing page
        When user clicks on Start now
        Then redirected to Defra ID page
        And user login with Single business crn and password(for DefraId)
        Then user click on sign in button
        And user confirm the org-review page
        And user agreed the business details is correct
        Then user continue to next page
        Then user clicks on Manage your claim
    Scenario:AC3 Exceptions on the screen
        Then clicked on continue button for endemics
        Then Validate the no option clicked for type of review message
    Scenario:AC2 Select claim type
        Then click on Endemics disease follow up review
        Then clicked on continue button for endemics
        Then validate if the user landded on Date of Visit page
    Scenario:AC4 'Back link' functionality on the page
        Then click on the back button
        And Validate the Type Of Review URL
