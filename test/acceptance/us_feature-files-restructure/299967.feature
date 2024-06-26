@smoketest

Feature: Endemics Claim Journey-8e Exception screen for  Confirm number of tests Screen in pig review claim

Scenario Outline: US-299967-AC1 Content on the exception screen
 Given user is on the /claim/endemics landing page
   When user clicks on Start now
   Then redirected to Defra ID page
   And user login with Single business crn and password(for DefraId)
   Then user click on sign in button
   When user check the business details
   And user confirm the org-review page
   And user agreed the business details is correct
   Then user continue to next page
   Then user clicks on Manage your claim 
    And user choose <LiveStockName> cattle for review
     Then user continue to next page
    #Given user is on vet visit date page
   #  When asked about the date the review was completed
    When user input the date in correct order
   #  And click on the option when vet visited the farm to carry out the review
    Then clicked on continue button for endemics
    And click on the option when vet visited the farm to carry out the review
    Then clicked on continue button for endemics
    And user confirm to meet the requirement
    Then user continue to next page
    When user enters the <species> name and <value>
    Then clicked on continue button
    When enter vet's full name
    Then click to continue the claim
    When user enter the rcvs number in endemics
    Then clicked on continue button for endemics
    When user input the test unique reference number in endemics
    Then clicked on continue button for endemics
    And user validate the header of the page of OralSamples
    Examples:
      | LiveStockName |species|value|
      | Pigs          |Pigs   | 57  |

Scenario Outline: blank value
   When user enters the no of samples <value>
   Then click to oral samples continue the claim
   Then validate the error message for blank input oral samples screen
   Examples:
   |value|
   | |

# --  less than 5 throws exception --
Scenario Outline: less than 5 input data
   When user enters the no of samples <value>
   Then click to oral samples continue the claim
   Then validate the exception for oral samples screen
   Then accept the cookies 
   Examples:
   |value|
   |2|

Scenario: US-299967-AC2 Links on the exception screen
    Then validate the at least five oral fluid samples tested link 
    Then validate the enter the no of oral fluid samples tested link

Scenario Outline: less than 5 input data
   When user enters the no of samples <value>
   Then click to oral samples continue the claim
   Then validate the exception for oral samples screen
   Examples:
   |value|
   |4|

#---- Get help with your claim-wording might change in future-----

Scenario: US-299967-AC3 Get help with your claim
    Then validate user can see get help with your claim header for oral samples
    Then check defra email ID exists
    And check phone number exists for oral samples
    Then validate call charges screen 

Scenario: US-299967-AC4 back link functionality
    Then click on the back link