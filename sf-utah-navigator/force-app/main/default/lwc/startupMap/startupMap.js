import { LightningElement, track, wire } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import LEAFLET from '@salesforce/resourceUrl/leaflet';
import getCompanies from '@salesforce/apex/CompanyController.getCompanies';
import submitCompanyClaim from '@salesforce/apex/CompanyController.submitCompanyClaim';

const SECTOR_COLORS = {
    'B2B Software': '#3b82f6',
    'FinTech': '#10b981',
    'Bio/Medical Tech': '#f59e0b',
    'Consumer': '#ec4899',
    'Security': '#ef4444',
    'Energy': '#f97316',
    'Marketplaces': '#8b5cf6',
};

const COUNTY_COORDS = {
    'Salt Lake': [40.7608, -111.8910],
    'Utah': [40.2969, -111.6946],
    'Davis': [40.9938, -111.8900],
    'Weber': [41.2608, -111.9657],
    'Washington': [37.1041, -113.5841],
    'Cache': [41.7370, -111.7697],
    'Summit': [40.8611, -110.9991],
    'Wasatch': [40.4652, -111.2835],
};

export default class StartupMap extends LightningElement {
    @track allCompanies = [];
    @track displayedCompanies = [];
    @track isLoading = true;
    @track selectedCompany = null;
    @track showClaimModal = false;
    @track claimingCompany = false;
    @track claimForm = { name: '', email: '', website: '', linkedin: '', description: '', address: '', stage: '', sector: '' };
    @track claimError = '';
    @track claimSuccess = false;
    @track claimSubmitting = false;
    @track expandedSectors = new Set();

    filters = { stage: 'All', sector: 'All', employeeCount: 'All', county: 'All' };
    searchTerm = '';
    map = null;
    markers = [];
    leafletReady = false;

    connectedCallback() {
        this.loadData();
    }

    renderedCallback() {
        if (!this.leafletReady) {
            this.leafletReady = true;
            Promise.all([
                loadStyle(this, LEAFLET + '/leaflet.css'),
                loadScript(this, LEAFLET + '/leaflet.js'),
            ]).then(() => this.initMap()).catch(e => console.error(e));
        }
    }

    loadData() {
        this.isLoading = true;
        getCompanies({
            sector: this.filters.sector,
            stage: this.filters.stage,
            employeeCount: this.filters.employeeCount,
            county: this.filters.county,
        }).then(data => {
            this.allCompanies = data.map(c => ({
                ...c,
                initial: c.Name ? c.Name.charAt(0).toUpperCase() : '?',
                isHiring: c.HiringStatus__c === 'Actively Hiring',
                cardCls: 'co-card',
            }));
            this.applySearch();
            this.isLoading = false;
            if (this.map) this.plotMarkers();
        }).catch(() => { this.isLoading = false; });
    }

    applySearch() {
        const term = this.searchTerm.toLowerCase();
        if (!term) {
            this.displayedCompanies = [...this.allCompanies];
        } else {
            this.displayedCompanies = this.allCompanies.filter(c =>
                (c.Name || '').toLowerCase().includes(term) ||
                (c.Description__c || '').toLowerCase().includes(term) ||
                (c.City__c || '').toLowerCase().includes(term)
            );
        }
        // Auto-expand sectors that have matches
        const sectors = new Set(this.displayedCompanies.map(c => c.Sector__c));
        this.expandedSectors = sectors;
    }

    get groupedSectors() {
        const map = {};
        this.displayedCompanies.forEach(c => {
            const s = c.Sector__c || 'Other';
            if (!map[s]) map[s] = [];
            map[s].push({ ...c, cardCls: c.Id === (this.selectedCompany && this.selectedCompany.Id) ? 'co-card selected' : 'co-card' });
        });
        return Object.entries(map)
            .sort((a, b) => b[1].length - a[1].length)
            .map(([name, companies]) => ({
                name,
                companies,
                count: companies.length,
                expanded: this.expandedSectors.has(name),
                dotStyle: `background:${SECTOR_COLORS[name] || '#94a3b8'}`,
            }));
    }

    get totalCount() {
        return this.displayedCompanies.length;
    }

    get hasResults() {
        return this.displayedCompanies.length > 0;
    }

    handleFilter(event) {
        const field = event.target.dataset.field;
        this.filters = { ...this.filters, [field]: event.target.value };
        this.loadData();
    }

    handleSearch(event) {
        this.searchTerm = event.target.value;
        this.applySearch();
        if (this.map) this.plotMarkers();
    }

    resetFilters() {
        this.filters = { stage: 'All', sector: 'All', employeeCount: 'All', county: 'All' };
        this.searchTerm = '';
        this.template.querySelectorAll('select').forEach(s => { s.value = 'All'; });
        const si = this.template.querySelector('.search-input');
        if (si) si.value = '';
        this.loadData();
    }

    handleSectorClick(event) {
        const sector = event.currentTarget.dataset.sector;
        const copy = new Set(this.expandedSectors);
        if (copy.has(sector)) copy.delete(sector);
        else copy.add(sector);
        this.expandedSectors = copy;
    }

    handleCompanyClick(event) {
        const id = event.currentTarget.dataset.id;
        const company = this.allCompanies.find(c => c.Id === id);
        if (!company) return;
        this.selectedCompany = company;
        // Pan map to company
        const coords = company.Latitude__c && company.Longitude__c
            ? [company.Latitude__c, company.Longitude__c]
            : COUNTY_COORDS[company.County__c];
        if (coords && this.map) {
            // eslint-disable-next-line no-undef
            this.map.setView(coords, 13);
        }
    }

    closeDetail() {
        this.selectedCompany = null;
    }

    initMap() {
        const el = this.template.querySelector('#map');
        if (!el || this.map) return;
        // eslint-disable-next-line no-undef
        this.map = L.map(el, { zoomControl: true }).setView([39.8, -111.5], 7);
        // eslint-disable-next-line no-undef
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO',
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(this.map);
        this.plotMarkers();
    }

    plotMarkers() {
        this.markers.forEach(m => m.remove());
        this.markers = [];
        this.displayedCompanies.forEach(company => {
            let lat = company.Latitude__c;
            let lng = company.Longitude__c;
            if (!lat || !lng) {
                const c = COUNTY_COORDS[company.County__c];
                if (!c) return;
                lat = c[0] + (Math.random() - 0.5) * 0.06;
                lng = c[1] + (Math.random() - 0.5) * 0.1;
            }
            const color = SECTOR_COLORS[company.Sector__c] || '#64748b';
            // eslint-disable-next-line no-undef
            const marker = L.circleMarker([lat, lng], {
                radius: 7,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.85,
            }).addTo(this.map);
            const popup = `<div style="font-family:sans-serif;min-width:160px">
                <b style="font-size:14px">${company.Name}</b><br/>
                <span style="color:#666;font-size:12px">${company.Sector__c || ''} · ${company.Stage__c || ''}</span><br/>
                <span style="font-size:12px">${company.City__c || ''}</span>
            </div>`;
            marker.bindPopup(popup);
            marker.on('click', () => {
                this.selectedCompany = company;
            });
            this.markers.push(marker);
        });
    }

    // Self-service profile claiming
    openClaimModal() {
        this.showClaimModal = true;
        this.claimSuccess = false;
        this.claimError = '';
        if (this.selectedCompany) {
            this.claimingCompany = true;
            this.claimForm = {
                name: this.selectedCompany.Name || '',
                email: '',
                website: this.selectedCompany.Website__c || '',
                linkedin: this.selectedCompany.LinkedIn__c || '',
                description: this.selectedCompany.Description__c || '',
                address: this.selectedCompany.Address__c || '',
                stage: this.selectedCompany.Stage__c || '',
                sector: this.selectedCompany.Sector__c || '',
            };
        } else {
            this.claimingCompany = false;
            this.claimForm = { name: '', email: '', website: '', linkedin: '', description: '', address: '', stage: '', sector: '' };
        }
    }

    closeClaimModal() {
        this.showClaimModal = false;
    }

    stopProp(event) {
        event.stopPropagation();
    }

    handleClaimField(event) {
        const field = event.target.dataset.field;
        this.claimForm = { ...this.claimForm, [field]: event.target.value };
    }

    submitClaim() {
        if (!this.claimForm.name || !this.claimForm.email) {
            this.claimError = 'Company name and work email are required.';
            return;
        }
        const emailDomain = this.claimForm.email.split('@')[1] || '';
        const websiteDomain = (this.claimForm.website || '').replace(/https?:\/\/(www\.)?/, '').split('/')[0];
        if (websiteDomain && emailDomain && !emailDomain.includes(websiteDomain) && !websiteDomain.includes(emailDomain)) {
            this.claimError = 'Email domain must match your company website domain for verification.';
            return;
        }
        this.claimSubmitting = true;
        this.claimError = '';
        submitCompanyClaim({ formData: JSON.stringify(this.claimForm) })
            .then(() => {
                this.claimSuccess = true;
                this.claimSubmitting = false;
            })
            .catch(err => {
                this.claimError = err.body ? err.body.message : 'An error occurred. Please try again.';
                this.claimSubmitting = false;
            });
    }
}
