public with sharing class EmailVerificationController {

    @AuraEnabled
    public static void sendVerificationEmail(String email, String resourceId, String companyDomain) {
        String emailDomain = email.substringAfter('@').toLowerCase();
        String targetDomain = companyDomain.toLowerCase().trim();

        if (emailDomain != targetDomain) {
            throw new AuraHandledException(
                'Email domain must match the company domain to make changes.'
            );
        }

        String token = generateToken();
        String verifyUrl = System.URL.getOrgDomainUrl().toExternalForm()
            + '/utah-navigator/s/verify?token=' + token + '&rid=' + resourceId;

        // Store token in custom setting or cache — using a simple OTP via email flow
        Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
        mail.setToAddresses(new List<String>{ email });
        mail.setSubject('Verify your edit request — Utah Founder\'s Navigator');
        mail.setHtmlBody(
            '<div style="font-family:sans-serif;max-width:500px">'
            + '<h2 style="color:#002654">Verify your edit request</h2>'
            + '<p>Click the button below to confirm your update to resource record. This link expires in 30 minutes.</p>'
            + '<a href="' + verifyUrl + '" style="background:#C8102E;color:white;padding:12px 24px;'
            + 'border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;">Verify &amp; Apply Changes</a>'
            + '<p style="color:#666;font-size:12px;margin-top:24px">If you did not request this, ignore this email.</p>'
            + '</div>'
        );
        mail.setSaveAsActivity(false);

        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    }

    private static String generateToken() {
        Blob b = Crypto.generateAesKey(128);
        return EncodingUtil.convertToHex(b).substring(0, 32);
    }
}
