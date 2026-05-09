public with sharing class ResourceController {

    @AuraEnabled(cacheable=true)
    public static List<Resource__c> getFilteredResources(
        String stage,
        String industry,
        String county,
        String community
    ) {
        List<String> targetTopics = getTopicsForStage(stage);
        String targetCommunity = getCommunityLabel(community);

        List<Resource__c> allResources = [
            SELECT Id, Name, Description__c, Link__c, Email__c,
                   Industries__c, Locations__c, Topics__c, Communities__c
            FROM Resource__c
            WITH USER_MODE
        ];

        List<Resource__c> matched = new List<Resource__c>();
        for (Resource__c r : allResources) {
            if (matches(r, targetTopics, industry, county, targetCommunity)) {
                matched.add(r);
            }
        }
        return matched;
    }

    private static Boolean matches(
        Resource__c r,
        List<String> targetTopics,
        String industry,
        String county,
        String targetCommunity
    ) {
        String locs = r.Locations__c != null ? r.Locations__c : '';
        String inds = r.Industries__c != null ? r.Industries__c : '';
        String tops = r.Topics__c != null ? r.Topics__c : '';
        String comms = r.Communities__c != null ? r.Communities__c : '';

        Boolean locationMatch = locs.contains('All counties') || locs.contains(county);
        Boolean industryMatch = inds.contains('All industries') || inds.contains(industry);

        Boolean topicMatch = false;
        for (String t : targetTopics) {
            if (tops.contains(t)) { topicMatch = true; break; }
        }

        Boolean communityMatch = String.isBlank(targetCommunity)
            || comms.length() == 0
            || comms.contains(targetCommunity)
            || comms.contains('Multiple communities')
            || comms.contains('Any');

        return locationMatch && industryMatch && topicMatch && communityMatch;
    }

    private static List<String> getTopicsForStage(String stage) {
        Map<String, List<String>> stageMap = new Map<String, List<String>>{
            'idea'      => new List<String>{'Start a Business', 'Funding'},
            'early'     => new List<String>{'Start a Business', 'Entrepreneurship Communities', 'Funding'},
            'revenue'   => new List<String>{'Funding', 'Marketing and Sales', 'Entrepreneurship Communities'},
            'scaling'   => new List<String>{'Late Stage Growth', 'Funding', 'Marketing and Sales'},
            'expanding' => new List<String>{'Late Stage Growth'}
        };
        return stageMap.containsKey(stage) ? stageMap.get(stage) : new List<String>{'Funding'};
    }

    private static String getCommunityLabel(String community) {
        Map<String, String> communityMap = new Map<String, String>{
            'veteran' => 'Veteran',
            'women'   => 'Women',
            'student' => 'Student',
            'rural'   => 'Rural',
            'none'    => ''
        };
        return communityMap.containsKey(community) ? communityMap.get(community) : '';
    }
}
