AnthropicSettings__mdt settings = [SELECT Id, ApiKey__c FROM AnthropicSettings__mdt WHERE DeveloperName = 'Default' LIMIT 1];
System.debug('Current key set: ' + (settings.ApiKey__c != 'REPLACE_WITH_API_KEY' && String.isNotBlank(settings.ApiKey__c)));
