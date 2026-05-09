// Run this anonymously to verify field access
List<String> fields = new List<String>{'Description__c','Communities__c','Industries__c','Locations__c','Topics__c','Link__c','Email__c'};
Map<String, Schema.SObjectField> fieldMap = Schema.SObjectType.Resource__c.fields.getMap();
for (String f : fields) {
    System.debug(f + ': ' + (fieldMap.containsKey(f) ? 'EXISTS' : 'MISSING'));
}
