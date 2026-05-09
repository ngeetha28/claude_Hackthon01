public with sharing class AirQualityController {
    private static final Map<String, String> COUNTY_TO_ID = new Map<String, String>{
        'Salt Lake' => 'slc',
        'Utah' => 'utah',
        'Davis' => 'davis',
        'Weber' => 'weber',
        'Washington' => 'washington',
        'Cache' => 'cache',
        'Summit' => 'summit',
        'Tooele' => 'tooele'
    };

    @AuraEnabled(cacheable=false)
    public static Map<String, Object> getAirQuality(String county) {
        String countyId = COUNTY_TO_ID.get(county);
        if (String.isBlank(countyId)) {
            countyId = 'slc';
        }

        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://air.utah.gov/rssFeed.php?id=' + countyId);
        req.setMethod('GET');
        req.setTimeout(10000);

        Http http = new Http();
        HttpResponse res = http.send(req);

        Map<String, Object> result = new Map<String, Object>();
        result.put('county', county);
        result.put('countyId', countyId);

        if (res.getStatusCode() == 200) {
            String body = res.getBody();
            result.put('raw', body);

            // Parse AQI value from RSS
            String aqi = extractBetween(body, '<aqi>', '</aqi>');
            String category = extractBetween(body, '<category>', '</category>');
            String pollutant = extractBetween(body, '<pollutant>', '</pollutant>');
            String description = extractBetween(body, '<description><![CDATA[', ']]></description>');
            if (String.isBlank(description)) {
                description = extractBetween(body, '<description>', '</description>');
            }

            if (String.isNotBlank(aqi)) {
                result.put('aqi', Integer.valueOf(aqi.trim()));
            }
            if (String.isNotBlank(category)) {
                result.put('category', category.trim());
            }
            if (String.isNotBlank(pollutant)) {
                result.put('pollutant', pollutant.trim());
            }
            if (String.isNotBlank(description)) {
                result.put('description', description.trim());
            }
            result.put('success', true);
        } else {
            result.put('success', false);
            result.put('error', 'HTTP ' + res.getStatusCode());
        }

        return result;
    }

    private static String extractBetween(String source, String startTag, String endTag) {
        Integer startIdx = source.indexOf(startTag);
        if (startIdx == -1) return null;
        startIdx += startTag.length();
        Integer endIdx = source.indexOf(endTag, startIdx);
        if (endIdx == -1) return null;
        return source.substring(startIdx, endIdx);
    }
}
