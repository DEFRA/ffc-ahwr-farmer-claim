
@smoketest
Feature:305796-Dev: 9 Links on 'Manage your Claims' screen
    Scenario Outline:AC2 Inline Exceptions on the screen when no input is provided-ON HOLD
        Given user is on the /claim/endemics landing page
        When user clicks on Start now
        Then redirected to Defra ID page
        And user login with Single business crn and password(for DefraId)
        Then user click on sign in button
        And user confirm the org-review page
        And user agreed the business details is correct
        Then user continue to next page