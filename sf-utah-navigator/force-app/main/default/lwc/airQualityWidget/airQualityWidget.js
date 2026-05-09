import { LightningElement, api, track, wire } from 'lwc';
import getAirQuality from '@salesforce/apex/AirQualityController.getAirQuality';

export default class AirQualityWidget extends LightningElement {
    @api county = 'Salt Lake';
    @track aqiData;
    @track isLoading = false;
    @track error;

    connectedCallback() {
        this.loadAirQuality();
    }

    @api
    set countyName(val) {
        this._county = val;
        this.loadAirQuality();
    }
    get countyName() {
        return this._county || this.county;
    }

    get effectiveCounty() {
        return this._county || this.county;
    }

    loadAirQuality() {
        this.isLoading = true;
        getAirQuality({ county: this.effectiveCounty })
            .then(result => {
                this.aqiData = result;
                this.isLoading = false;
            })
            .catch(err => {
                this.error = err;
                this.isLoading = false;
            });
    }

    get hasData() {
        return this.aqiData && this.aqiData.success && this.aqiData.aqi != null;
    }

    get aqiValue() {
        return this.aqiData ? this.aqiData.aqi : '--';
    }

    get category() {
        return this.aqiData ? this.aqiData.category : '';
    }

    get pollutant() {
        return this.aqiData ? this.aqiData.pollutant : '';
    }

    get aqiCardClass() {
        const aqi = this.aqiData ? this.aqiData.aqi : 0;
        let colorClass = 'good';
        if (aqi > 300) colorClass = 'hazardous';
        else if (aqi > 200) colorClass = 'very-unhealthy';
        else if (aqi > 150) colorClass = 'unhealthy';
        else if (aqi > 100) colorClass = 'unhealthy-sensitive';
        else if (aqi > 50) colorClass = 'moderate';
        return `aqi-card aqi-${colorClass}`;
    }
}
