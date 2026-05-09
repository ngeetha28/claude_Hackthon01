public without sharing class SiliconSlopesAgentAction {

    public class ResourceRequest {
        @InvocableVariable(label='Search Query' description='What the founder is looking for' required=true)
        public String query;

        @InvocableVariable(label='Business Stage' description='e.g. Pre-revenue startup, Growing business')
        public String stage;

        @InvocableVariable(label='Industry' description='e.g. SaaS / tech, Landscaping, Healthcare')
        public String industry;

        @InvocableVariable(label='Location' description='e.g. Salt Lake County, St. George, Rural Utah')
        public String location;

        @InvocableVariable(label='Current Need' description='e.g. Funding, Mentoring, Licensing')
        public String need;
    }

    public class ResourceResult {
        @InvocableVariable(label='Formatted Resources')
        public String resources;
    }

    @InvocableMethod(
        label='Get Utah Startup Resources'
        description='Retrieves relevant Utah startup and business resources from the Silicon Slopes database based on the founder profile and query.'
        callout=false
    )
    public static List<ResourceResult> getResources(List<ResourceRequest> requests) {
        ResourceRequest req = requests[0];

        // Build dynamic SOQL filters
        String queryStr = 'SELECT Name, Description__c, Topics__c, Industries__c, Communities__c, Locations__c, Link__c ' +
                          'FROM Resource__c ORDER BY Name LIMIT 200';
        List<Resource__c> allResources = Database.query(queryStr);

        // Score and filter resources
        List<ScoredResource> scored = new List<ScoredResource>();
        for (Resource__c r : allResources) {
            Integer score = scoreResource(r, req);
            if (score > 0) {
                scored.add(new ScoredResource(r, score));
            }
        }

        // Sort by score descending
        scored.sort();

        // Take top 5
        Integer limit5 = Math.min(5, scored.size());
        String output = '';
        for (Integer i = 0; i < limit5; i++) {
            Resource__c r = scored[i].resource;
            output += formatResource(r, i + 1);
        }

        if (String.isBlank(output)) {
            output = 'I searched the Utah resources database but could not find an exact match for your situation. ' +
                     'I recommend visiting business.utah.gov or contacting the Utah GOED office directly for statewide support.';
        }

        ResourceResult result = new ResourceResult();
        result.resources = output;
        return new List<ResourceResult>{ result };
    }

    private static Integer scoreResource(Resource__c r, ResourceRequest req) {
        Integer score = 0;
        String combined = (
            (r.Description__c  != null ? r.Description__c  : '') + ' ' +
            (r.Topics__c       != null ? r.Topics__c       : '') + ' ' +
            (r.Industries__c   != null ? r.Industries__c   : '') + ' ' +
            (r.Communities__c  != null ? r.Communities__c  : '') + ' ' +
            (r.Locations__c    != null ? r.Locations__c    : '') + ' ' +
            r.Name
        ).toLowerCase();

        if (String.isNotBlank(req.query)) {
            for (String word : req.query.toLowerCase().split('\\s+')) {
                if (word.length() > 3 && combined.contains(word)) score += 2;
            }
        }
        if (String.isNotBlank(req.industry)) {
            for (String word : req.industry.toLowerCase().split('[/\\s,]+')) {
                if (word.length() > 2 && combined.contains(word)) score += 3;
            }
        }
        if (String.isNotBlank(req.need)) {
            for (String word : req.need.toLowerCase().split('[/\\s,]+')) {
                if (word.length() > 3 && combined.contains(word)) score += 3;
            }
        }
        if (String.isNotBlank(req.location)) {
            String loc = req.location.toLowerCase();
            if (combined.contains(loc) || combined.contains('statewide')) score += 2;
        }
        if (String.isNotBlank(req.stage)) {
            String st = req.stage.toLowerCase();
            if (combined.contains('startup') && st.contains('startup'))   score += 2;
            if (combined.contains('small business') && st.contains('small')) score += 2;
            if (combined.contains('entrepreneur')) score += 1;
        }
        return score;
    }

    private static String formatResource(Resource__c r, Integer num) {
        String out = num + '. ' + r.Name + '\n';
        if (String.isNotBlank(r.Description__c)) {
            String summary = r.Description__c.length() > 200 ? r.Description__c.substring(0, 200) + '...' : r.Description__c;
            out += 'What it offers: ' + summary + '\n';
        }
        if (String.isNotBlank(r.Topics__c))    out += 'Topics: '    + r.Topics__c    + '\n';
        if (String.isNotBlank(r.Locations__c)) out += 'Available: ' + r.Locations__c + '\n';
        if (String.isNotBlank(r.Link__c))      out += 'Link: '      + r.Link__c      + '\n';
        out += '\n';
        return out;
    }

    // Comparable wrapper for sorting
    private class ScoredResource implements Comparable {
        public Resource__c resource;
        public Integer score;
        public ScoredResource(Resource__c r, Integer s) { resource = r; score = s; }
        public Integer compareTo(Object other) {
            ScoredResource o = (ScoredResource) other;
            return o.score - this.score; // descending
        }
    }
}
