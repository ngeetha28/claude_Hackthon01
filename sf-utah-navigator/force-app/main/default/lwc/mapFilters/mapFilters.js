import { LightningElement, api, track } from 'lwc';

export default class MapFilters extends LightningElement {
    @api resultCount;
    @track filters = {
        sector: 'All',
        stage: 'All',
        employeeCount: 'All',
        county: 'All',
        hiringStatus: 'All'
    };

    handleChange(event) {
        const field = event.target.dataset.field;
        this.filters = { ...this.filters, [field]: event.target.value };
        this.dispatchEvent(new CustomEvent('filterchange', { detail: { ...this.filters } }));
    }

    handleReset() {
        this.filters = { sector: 'All', stage: 'All', employeeCount: 'All', county: 'All', hiringStatus: 'All' };
        this.template.querySelectorAll('select').forEach(s => { s.value = 'All'; });
        this.dispatchEvent(new CustomEvent('filterchange', { detail: { ...this.filters } }));
    }
}
