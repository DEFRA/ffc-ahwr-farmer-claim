@smoketest
Feature:305680-Dev-8 Display claims on Manage your Claims screen
    Scenario Outline:AC2 Inline Exceptions on the screen when no input is provided-ON HOLD
        Given user is on the /claim/endemics landing page
        When user clicks on Start now
        Then redirected to Defra ID page
        And user login with Single business crn and password(for DefraId)
        Then user click on sign in button
        And user confirm the org-review page
        And user agreed the business details is correct
        Then user continue to next page
        Then check <tagToCheck> for the <status> for the agreement
        Examples:
        |tagToCheck|status|
        | CLAIMED  | 11   |
     Scenario Outline:AC2 Inline Exceptions on the screen when no input is provided-IN-CHECK
        Then check <tagToCheck> for the <status> for the agreement
        Examples:
        |tagToCheck|status|
        | CLAIMED  | 5  |
    Scenario Outline:AC2 Inline Exceptions on the screen when no input is provided-Recommended to Pay
        Then check <tagToCheck> for the <status> for the agreement
        Examples:    
          |tagToCheck|status|
        | CLAIMED  | 12  |
     Scenario Outline:AC2 Inline Exceptions on the screen when no input is provided-Recommended to Reject
        Then check <tagToCheck> for the <status> for the agreement
        Examples:
        |tagToCheck|status|
        | CLAIMED  | 13  |
    Scenario Outline:AC2 Inline Exceptions on the screen when no input is provided -AUTHORISED
        Then check <tagToCheck> for the <status> for the agreement
        Examples:    
          |tagToCheck|status|
        | CLAIMED  | 14  |
    Scenario Outline:AC2 Inline Exceptions on the screen when no input is provided-READY TO PAY
        Then check <tagToCheck> for the <status> for the agreement
        Examples:      
          |tagToCheck|status|
        | CLAIMED  | 9   |
     Scenario Outline:AC2 Inline Exceptions on the screen when no input is provided-SENT TO FINANCE
        Then check <tagToCheck> for the <status> for the agreement
        Examples:      
         |tagToCheck|status|
        | CLAIMED  | 15   |
     Scenario Outline:AC2 Inline Exceptions on the screen when no input is provided-PAYMENT HELD
        Then check <tagToCheck> for the <status> for the agreement
        Examples:      
         |tagToCheck|status|
        | CLAIMED  | 16  |
     Scenario Outline:AC2 Inline Exceptions on the screen when no input is provided-REJECTED
        Then check <tagToCheck> for the <status> for the agreement
        Examples:      
         |tagToCheck|status|
        | REJECTED  | 10   |
     Scenario Outline:AC2 Inline Exceptions on the screen when no input is provided-PAID
        Examples:      
          |tagToCheck|status|
          | PAID     | 8   |   
        
