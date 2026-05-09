public without sharing class CompanyController {
    @AuraEnabled(cacheable=true)
    public static List<Company__c> getCompanies(String sector, String stage, String employeeCount, String county, String hiringStatus) {
        String query = 'SELECT Id, Name, Website__c, EmployeeCount__c, Sector__c, Stage__c, LinkedIn__c, Description__c, Address__c, City__c, County__c, HiringStatus__c, YearFounded__c, Latitude__c, Longitude__c FROM Company__c WHERE Id != null';
        if (String.isNotBlank(sector) && sector != 'All') {
            query += ' AND Sector__c = :sector';
        }
        if (String.isNotBlank(stage) && stage != 'All') {
            query += ' AND Stage__c = :stage';
        }
        if (String.isNotBlank(employeeCount) && employeeCount != 'All') {
            query += ' AND EmployeeCount__c = :employeeCount';
        }
        if (String.isNotBlank(county) && county != 'All') {
            query += ' AND County__c = :county';
        }
        if (String.isNotBlank(hiringStatus) && hiringStatus != 'All') {
            query += ' AND HiringStatus__c = :hiringStatus';
        }
        query += ' ORDER BY Name LIMIT 500';
        return Database.query(query);
    }

    @AuraEnabled(cacheable=true)
    public static Company__c getCompanyById(Id companyId) {
        return [SELECT Id, Name, Website__c, EmployeeCount__c, Sector__c, Stage__c, LinkedIn__c, Description__c, Address__c, City__c, County__c, HiringStatus__c, YearFounded__c, Latitude__c, Longitude__c FROM Company__c WHERE Id = :companyId LIMIT 1];
    }

    @AuraEnabled
    public static void submitCompanyClaim(String formData) {
        // Parse JSON form submission and send verification email
        Map<String, Object> form = (Map<String, Object>) JSON.deserializeUntyped(formData);
        String companyName = (String) form.get('name');
        String email = (String) form.get('email');
        String website = (String) form.get('website');
        String linkedin = (String) form.get('linkedin');
        String description = (String) form.get('description');
        String address = (String) form.get('address');
        String stage = (String) form.get('stage');
        String sector = (String) form.get('sector');

        if (String.isBlank(companyName) || String.isBlank(email)) {
            throw new AuraHandledException('Company name and email are required.');
        }

        // Send notification email to GOED admin for review
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setToAddresses(new List<String>{ 'ngeetha28@gmail.com' });
        mail.setSubject('Utah Startup Map: Company Claim/Submission - ' + companyName);
        mail.setPlainTextBody(
            'A company has been submitted/claimed on the Utah Startup Map.\n\n' +
            'Company: ' + companyName + '\n' +
            'Email: ' + email + '\n' +
            'Website: ' + website + '\n' +
            'LinkedIn: ' + linkedin + '\n' +
            'Description: ' + description + '\n' +
            'Address: ' + address + '\n' +
            'Stage: ' + stage + '\n' +
            'Sector: ' + sector + '\n\n' +
            'Please review and update the Company record in Salesforce.'
        );
        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    }
}
