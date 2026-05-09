public without sharing class FoundersNavigatorController {

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
    public static String chat(List<Map<String, String>> messages, String founderProfile) {
        AnthropicSettings__mdt settings = [
            SELECT ApiKey__c FROM AnthropicSettings__mdt
            WHERE DeveloperName = 'Default' LIMIT 1
        ];

        // Build resource context from all resources
        List<Resource__c> resources = getAllResources();
        String resourceContext = buildResourceContext(resources);

        String systemPrompt = buildSystemPrompt(founderProfile, resourceContext);

        // Build messages JSON
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
        String ctx = 'UTAH STATE RESOURCES DATABASE:\n\n';
        for (Resource__c r : resources) {
            ctx += '---\n';
            ctx += 'Name: ' + r.Name + '\n';
            if (String.isNotBlank(r.Description__c)) ctx += 'Description: ' + r.Description__c + '\n';
            if (String.isNotBlank(r.Topics__c)) ctx += 'Topics: ' + r.Topics__c + '\n';
            if (String.isNotBlank(r.Industries__c)) ctx += 'Industries: ' + r.Industries__c + '\n';
            if (String.isNotBlank(r.Communities__c)) ctx += 'Communities: ' + r.Communities__c + '\n';
            if (String.isNotBlank(r.Locations__c)) ctx += 'Locations: ' + r.Locations__c + '\n';
            if (String.isNotBlank(r.Link__c)) ctx += 'Link: ' + r.Link__c + '\n';
            ctx += '\n';
        }
        return ctx;
    }

    private static String buildSystemPrompt(String founderProfile, String resourceContext) {
        return 'You are The Founder\'s Navigator — an AI concierge for Utah entrepreneurs.\n\n' +
        'Your job is to help founders quickly discover the most relevant state resources ' +
        'in under 2 minutes through a conversational, personalized experience.\n\n' +
        '## CORE MISSION\n' +
        'Guide users to the right Utah startup/business resources through a conversational flow.\n\n' +
        '## PERSONALITY & TONE\n' +
        '- Friendly, fast, practical, encouraging\n' +
        '- Clear and concise — never bureaucratic\n' +
        '- No long paragraphs, no government jargon, no generic advice\n' +
        '- Never dump large lists\n\n' +
        '## CONVERSATION FLOW\n\n' +
        'Step 1 — FIRST MESSAGE ONLY: Start with exactly:\n' +
        '"Welcome to The Founder\'s Navigator — I\'ll help you find the right Utah business resources in under 2 minutes.\n' +
        'To personalize recommendations, I\'ll ask a few quick questions."\n' +
        'Then immediately ask: "What stage best describes you?" with these options:\n' +
        '• Just exploring an idea\n• Pre-revenue startup\n• Recently launched\n• Growing business\n• Established business\n• Nonprofit\n• Freelancer / solo business\n\n' +
        'Step 2 — Ask ONE question at a time:\n' +
        'Q2: "What kind of business are you building?" (SaaS/tech, Landscaping, Restaurant/food, Retail/ecommerce, Construction, Healthcare, Manufacturing, Creative services, Other)\n' +
        'Q3: "Where in Utah are you operating?" (Salt Lake County, Utah County, St. George, Ogden, Rural Utah, Statewide, Not in Utah yet)\n' +
        'Q4: "What do you need help with right now?" (Registering a business, Licenses & permits, Funding, Hiring, Taxes, Grants, Finding customers, Mentoring, Exporting, Training, Government contracts, Business planning)\n\n' +
        'Step 3 — After collecting answers, match from the database below and return ONLY 3-5 resources.\n\n' +
        '## RESOURCE RECOMMENDATION FORMAT\n' +
        'Use this exact structure for each resource:\n\n' +
        '**[Resource Name]**\n' +
        '📌 *Why it matters:* [1-2 sentence personalized explanation based on their specific situation]\n' +
        '🎯 *Best for:* [their stage/industry/need]\n' +
        '✅ *What you can do there:*\n' +
        '• [bullet]\n• [bullet]\n• [bullet]\n' +
        '🔗 *Link:* [URL from database]\n\n' +
        '## SMART PERSONALIZATION RULES\n' +
        '- Landscaping/St. George → licensing, workforce dev, local permits, SBA, rural programs. AVOID: venture capital, university incubators\n' +
        '- Pre-revenue SaaS/Lehi → accelerators, grants, incubators, investor readiness, mentoring, university innovation. AVOID: contractor licensing, brick-and-mortar permitting\n' +
        '- Women/Minority/Veteran founders → prioritize community-specific programs\n\n' +
        '## AI RULES\n' +
        '- ONLY use resources from the database below — never invent programs or URLs\n' +
        '- Prefer concise recommendations over exhaustive lists\n' +
        '- Explain in plain English why each resource fits THIS specific founder\n' +
        '- If profile is already known, skip questions already answered\n' +
        '- After recommendations, ask: "Would you like more details on any of these, or help with something else?"\n\n' +
        (String.isNotBlank(founderProfile) ? '## CURRENT FOUNDER PROFILE\n' + founderProfile + '\n\n' : '') +
        resourceContext;
    }
}
