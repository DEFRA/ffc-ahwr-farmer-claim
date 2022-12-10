@wip
Feature: Farmer claim


  Scenario: Farmer apply for claim with wrong email.
    Given I am on the landing page
    Then I click on startNow
    When I enter my invalid "livsey.willaism@rpa.com"
    Then I should see an error "livsey.willaism@rpa.com"


  Scenario: Farmer apply for claim with correct email
    Given I am on the landing page
    Then I click on startNow
    When I enter my valid "livsey-erubamie.williams@capgemini.com"

  Scenario:  Farmer completes application for Beef Cattle
    Given farmer clicks on email link "0f9ecf32-da18-4e17-8a94-c37732d97489" "livsey-erubamie.williams@capgemini.com"
    When I select yes my details are correct on farmer review page
    Then I enter day month and year on vet visit date page
    Then I enter my vet's "livsey erubamie williams"
    Then I enter "1234567" on vet-rcvs page
    Then I enter "livsey1234567williams" on urn-result page
    Then I click continue on check answers page
    Then I click continue on submit claim page
