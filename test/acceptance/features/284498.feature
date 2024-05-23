@smoketest
Feature:284498-Dev: 6 Check your details screen to Manage your claims screen
    Scenario Outline:284498-Dev: 6 Check your details screen to Manage your claims screen
        Given user is on the /claim/endemics landing page
        When user clicks on Start now
        Then redirected to Defra ID page
        And user login with Single business crn and password(for DefraId)
        Then user click on sign in button
        #When user check the business details
        And user confirm the org-review page
        And user agreed the business details is correct
        Then user continue to next page

    Scenario: AC3 Gov.uk link on the header
        Then click on gov.uk in the left pane
        Then validate if the user redirected to gov.uk

    Scenario:AC-5 Service name link on the header

        Given user is on the /claim/endemics landing page
        When user clicks on Start now
        When user check the business details
        And user confirm the org-review page
        And user agreed the business details is correct
        Then user continue to next page
        Then user is able to see the Annual health and welfare review of livestock link on the middle top of the header
        Then user clicks on the service name link
        Then user must be redirected to service guidance start pages

    Scenario Outline:AC2 Logic for High Multi and Mid multi SBI case

        Then close browser
        Given user is on the /claim/endemics landing page
        When user clicks on Start now
        Then redirected to Defra ID page
        And user login with Multiple business crn and password(for DefraId)
        Then user click on sign in button
        When select the <business> for application
        When click on continue button
        Examples:
            | business                   |
            | Long Close - SBI 106581532 |