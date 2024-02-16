@smoketest1

Feature: Endemics Claim Journey-6b-Exception screen for 'Number of animals tested' Screen in review claim

Scenario: US-299873-AC1-Content header on 
   Given user is on the /claim/endemics landing page
   When user clicks on Start now
   Then redirected to Defra ID page
   And user login with Single business crn and password(for DefraId)
   Then user click on sign in button
   # check-detail page content development in progress
   When user check the business details
   And user confirm the org-review page
   And user agreed the business details is correct
   Then user continue to next page
   Given user is on the /claim/endemics/number-of-species-tested landing page
   And user validate the header of the page

Scenario Outline: blank value
   When user enters the no of animals <value>
   Then click to species continue the claim
   Then validate the error message for blank input
   Examples:
   |value|
   | |

Scenario Outline: special characters
   When user enters the no of animals <value>
   Then click to species continue the claim
   Then validate the error message for special character
   Examples:
   |value|
   |$|
   
Scenario Outline: less than minimum number
   When user enters the no of animals <value>
   Then click to species continue the claim
   Then validate the exception screen for no of animals tested
   Then accept the cookies 
   Examples:
   |value|
   |2|

Scenario: US-299873-AC2 Links on the exception screen
    Then validate the cattle testing link in exception screen 
    Then validate the sheep testing link in exception screen 
    Then validate the pig testing link in exception screen 
    Then validate the enter the no of animals tested link in exception screen 

Scenario Outline: Bigger number 
   When user enters the no of animals <value>
   Then click to species continue the claim
   Then validate the exception screen for no of animals tested
   Examples:
   |value|
   |2678|

# future 'Get help with your claim' going to be changed in wording
Scenario: US-299873-AC3 Get help with your claim
    Then validate user can see get help with your claim header
    Then check defra email ID exists
    And check phone number exists
    Then validate call charges screen 

Scenario: US-299873-AC4 back link functionality
    Then click on the back link
    





   

      
     
