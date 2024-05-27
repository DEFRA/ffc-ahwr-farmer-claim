@smoketest

Feature: Endemics Claim Journey-6b-Exception screen for 'Number of animals tested' Screen in review claim

Scenario Outline: US-299873-AC1-Content header on 
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
   
    
    Examples:
      | LiveStockName |
      | Pigs          |

Scenario Outline: blank value
  When user enters the <species> name and <value>
   Then click to species continue the claim
   Then validate the error message for blank input
   Examples:
   |species|value|
   |Pigs   |     |

Scenario Outline: special characters
   When user enters the <species> name and <value>
   Then click to species continue the claim
   Then validate the error message for special character
   Examples:
  |species|value|
   |Pigs   | $$$   |

Scenario Outline: less than minimum number
   When user enters the <species> name and <value>
   Then click to species continue the claim
   Then validate the exception screen for no of animals tested
   Then accept the cookies 
   Examples:
     |species|value|
   |Pigs   | 3 |

Scenario: US-299873-AC2 Links on the exception screen
    Then validate the cattle testing link in exception screen 
    Then validate the sheep testing link in exception screen 
    Then validate the pig testing link in exception screen
    Then validate the enter the no of animals tested link in exception screen 

Scenario Outline: less than minimum number
   When user enters the <species> name and <value>
   Then click to species continue the claim
   Then validate the exception screen for no of animals tested
   # Then accept the cookies 
   Examples:
     |species|value|
   |Pigs   | 3 |
   
# future 'Get help with your claim' going to be changed in wording
Scenario: US-299873-AC3 Get help with your claim
    Then validate user can see get help with your claim header
    Then check defra email ID exists
    And check phone number exists
    Then validate call charges screen 

# Scenario: US-299873-AC4 back link functionality
#     Then click on the back link
    





   

      
     
