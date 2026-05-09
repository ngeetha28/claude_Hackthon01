// Test the API key is set and callout works
AnthropicSettings__mdt s = [SELECT ApiKey__c FROM AnthropicSettings__mdt WHERE DeveloperName='Default' LIMIT 1];
System.debug('API key length: ' + s.ApiKey__c.length());
System.debug('Key starts with: ' + s.ApiKey__c.substring(0, 15));

HttpRequest req = new HttpRequest();
req.setEndpoint('https://api.anthropic.com/v1/messages');
req.setMethod('POST');
req.setHeader('Content-Type', 'application/json');
req.setHeader('anthropic-version', '2023-06-01');
req.setHeader('x-api-key', s.ApiKey__c);
req.setBody('{"model":"claude-haiku-4-5-20251001","max_tokens":100,"messages":[{"role":"user","content":"Say OK"}]}');
req.setTimeout(20000);

Http http = new Http();
HttpResponse res = http.send(req);
System.debug('Status: ' + res.getStatusCode());
System.debug('Response: ' + res.getBody().substring(0, Math.min(200, res.getBody().length())));
