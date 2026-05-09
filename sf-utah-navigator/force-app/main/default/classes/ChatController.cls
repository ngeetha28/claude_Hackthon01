public with sharing class ChatController {

    @AuraEnabled
    public static String chat(
        List<Map<String, String>> messages,
        String stage,
        String industry,
        String county,
        String community,
        List<String> resourceContext
    ) {
        String systemPrompt = buildSystemPrompt(stage, industry, county, community, resourceContext);

        List<Object> apiMessages = new List<Object>();
        for (Map<String, String> m : messages) {
            apiMessages.add(new Map<String, Object>{
                'role'    => m.get('role'),
                'content' => m.get('content')
            });
        }

        Map<String, Object> requestBody = new Map<String, Object>{
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 1024,
            'system'     => systemPrompt,
            'messages'   => apiMessages
        };

        HttpRequest req = new HttpRequest();
        req.setEndpoint('callout:Anthropic_API/v1/messages');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('anthropic-version', '2023-06-01');
        req.setBody(JSON.serialize(requestBody));
        req.setTimeout(30000);

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            Map<String, Object> parsed = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<Object> content = (List<Object>) parsed.get('content');
            Map<String, Object> firstBlock = (Map<String, Object>) content[0];
            return (String) firstBlock.get('text');
        }
        throw new AuraHandledException('AI service error: ' + res.getStatus());
    }

    private static String buildSystemPrompt(
        String stage, String industry, String county, String community,
        List<String> resourceContext
    ) {
        String ctx = resourceContext != null ? String.join(resourceContext, '\n') : '';
        return 'You are the Utah Founder\'s Navigator, an AI advisor helping entrepreneurs discover state resources.\n\n'
            + 'Founder Profile:\n'
            + '- Business Stage: ' + stage + '\n'
            + '- Industry: ' + industry + '\n'
            + '- County: ' + county + '\n'
            + '- Community: ' + community + '\n\n'
            + 'Available Utah state resources for this founder:\n' + ctx + '\n\n'
            + 'Guidelines:\n'
            + '- Only recommend resources from the list above\n'
            + '- Be concise and direct — founders are busy\n'
            + '- Ask follow-up questions to narrow down needs if helpful\n'
            + '- Format resource recommendations with name, what it does, and link\n'
            + '- Personalize advice to their specific stage, location, and community';
    }
}
