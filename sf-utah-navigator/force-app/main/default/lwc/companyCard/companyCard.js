import { LightningElement, api, track } from 'lwc';

export default class CompanyCard extends LightningElement {
    @api company;
    @track expanded = false;
    @track showAirQuality = false;

    get initial() {
        return this.company && this.company.Name ? this.company.Name.charAt(0).toUpperCase() : '?';
    }

    get isHiring() {
        return this.company && this.company.HiringStatus__c === 'Actively Hiring';
    }

    handleCardClick() {
        this.expanded = !this.expanded;
        if (this.expanded && this.company.County__c) {
            this.showAirQuality = true;
        }
        this.dispatchEvent(new CustomEvent('select', { detail: this.company }));
    }

    stopProp(event) {
        event.stopPropagation();
    }
}
