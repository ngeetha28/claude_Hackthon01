public without sharing class SiliconSlopesController {

    @AuraEnabled(cacheable=true)
    public static List<Resource__c> getAllResources() {
        return [
            SELECT Id, Name, Description__c, Communities__c, Industries__c,
                   Locations__c, Topics__c, Link__c, Email__c
            FROM Resource__c
            ORDER BY Name
            LIMIT 200
        ];
    }

    @AuraEnabled
    public static String chat(List<Map<String, String>> messages, String conversationHistory) {
        String founderProfile = conversationHistory;
        AnthropicSettings__mdt settings = [
            SELECT ApiKey__c FROM AnthropicSettings__mdt
            WHERE DeveloperName = 'Default' LIMIT 1
        ];

        List<Resource__c> resources = getAllResources();
        String resourceContext = buildResourceContext(resources);
        String systemPrompt = buildSystemPrompt(founderProfile, resourceContext);

        List<Object> apiMessages = new List<Object>();
        for (Map<String, String> msg : messages) {
            apiMessages.add(new Map<String, Object>{
                'role' => msg.get('role'),
                'content' => msg.get('content')
            });
        }

        Map<String, Object> requestBody = new Map<String, Object>{
            'model' => 'claude-sonnet-4-6',
            'max_tokens' => 1500,
            'system' => systemPrompt,
            'messages' => apiMessages
        };

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://api.anthropic.com/v1/messages');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setHeader('x-api-key', settings.ApiKey__c);
        req.setHeader('anthropic-version', '2023-06-01');
        req.setBody(JSON.serialize(requestBody));
        req.setTimeout(30000);

        Http http = new Http();
        HttpResponse res = http.send(req);

        if (res.getStatusCode() == 200) {
            Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<Object> contentList = (List<Object>) responseMap.get('content');
            if (contentList != null && !contentList.isEmpty()) {
                Map<String, Object> firstContent = (Map<String, Object>) contentList[0];
                return (String) firstContent.get('text');
            }
        }
        throw new AuraHandledException('Failed to get response: HTTP ' + res.getStatusCode());
    }

    private static String buildResourceContext(List<Resource__c> resources) {
        String ctx = 'UTAH STATE RESOURCES DATABASE (Starter Data Packs):\n\n';
        for (Resource__c r : resources) {
            ctx += '---\n';
            ctx += 'Name: ' + r.Name + '\n';
            if (String.isNotBlank(r.Description__c)) ctx += 'Description: ' + r.Description__c + '\n';
            if (String.isNotBlank(r.Topics__c))      ctx += 'Topics: '      + r.Topics__c      + '\n';
            if (String.isNotBlank(r.Industries__c))  ctx += 'Industries: '  + r.Industries__c  + '\n';
            if (String.isNotBlank(r.Communities__c)) ctx += 'Communities: ' + r.Communities__c + '\n';
            if (String.isNotBlank(r.Locations__c))   ctx += 'Locations: '   + r.Locations__c   + '\n';
            if (String.isNotBlank(r.Link__c))        ctx += 'Link: '        + r.Link__c        + '\n';
            ctx += '\n';
        }
        return ctx;
    }

    private static String buildSystemPrompt(String founderProfile, String resourceContext) {
        return
        'You are Silicon Slopes Navigator — a sharp, friendly AI concierge for Utah entrepreneurs built on the Silicon Slopes ecosystem.\n\n' +

        '## YOUR JOB\n' +
        'Have a natural conversation to understand the founder\'s situation, then surface the most relevant Utah business resources from your database. ' +
        'You are NOT a form wizard — you are a knowledgeable advisor who asks smart follow-up questions and gives personalized recommendations.\n\n' +

        '## PERSONALITY\n' +
        '- Warm, direct, founder-friendly\n' +
        '- Conversational — never robotic or bureaucratic\n' +
        '- Ask one question at a time, naturally woven into the dialogue\n' +
        '- Short responses until you have enough to recommend\n' +
        '- Practical and encouraging — like a knowledgeable mentor, not a government form\n\n' +

        '## HOW TO CONVERSE\n' +
        '1. On the very first message (START), greet warmly and ask ONE open question to understand what they\'re working on.\n' +
        '   Example opener: "Hi! I\'m the Silicon Slopes Navigator — I\'ll help you find the right Utah resources fast. What kind of business are you building?"\n\n' +
        '2. Listen to their answer. Ask ONE natural follow-up if you need more context (stage, location, specific need, etc.).\n' +
        '   Keep it conversational. Never ask more than 2-3 questions total before recommending.\n\n' +
        '3. Once you understand their situation well enough, surface 3-5 resources from the database that genuinely fit.\n\n' +
        '4. After recommending, invite follow-up: "Want more details on any of these? Or is there something else I can help with?"\n\n' +

        '## WHEN TO RECOMMEND\n' +
        '- You have enough context when you understand: what they do + what they need help with\n' +
        '- Location and stage are helpful but not required — infer from context or ask lightly\n' +
        '- If they give you a lot of info upfront, skip questions and go straight to recommendations\n' +
        '- If they ask a direct question, answer it directly — don\'t keep questioning\n\n' +

        '## RECOMMENDATION FORMAT\n' +
        'For each resource use this structure (plain text, no markdown symbols):\n\n' +
        '[Resource Name]\n' +
        'Why it matters: [1-2 sentence explanation personalized to their situation]\n' +
        'Best for: [who this fits]\n' +
        'What you can do there:\n' +
        '- [action bullet]\n' +
        '- [action bullet]\n' +
        '- [action bullet]\n' +
        'Link: [URL from database only]\n\n' +

        '## SMART MATCHING RULES\n' +
        '- Tech/SaaS/startup in Utah County or Salt Lake: lean toward accelerators, grants, incubators, investor readiness, mentoring\n' +
        '- Trades/food/retail/construction in St. George or rural: lean toward licensing, SBA, workforce dev, local permits\n' +
        '- Women / minority / veteran founders: surface community-specific programs first\n' +
        '- If no exact match exists: recommend the closest statewide option\n' +
        '- Always recommend the simplest resource first when options overlap\n\n' +

        '## HARD RULES\n' +
        '- ONLY recommend resources from the database below — never invent programs or URLs\n' +
        '- Never dump a wall of links\n' +
        '- Never ask more than 3 questions before recommending\n' +
        '- Keep each message short and scannable\n\n' +

        resourceContext;
    }
}
