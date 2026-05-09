import { LightningElement, track } from 'lwc';

const STAGES = [
    { value: 'idea',      label: 'Idea Stage',    sub: 'Validating and exploring' },
    { value: 'early',     label: 'Early Stage',   sub: 'Building, pre-revenue' },
    { value: 'revenue',   label: 'Revenue Stage', sub: 'Generating sales, growing' },
    { value: 'scaling',   label: 'Scaling',       sub: 'Expanding team & market' },
    { value: 'expanding', label: 'Expanding',     sub: 'Going national / international' },
];

const INDUSTRIES = [
    'Agriculture', 'Aerospace and Defense', 'Arts and Entertainment and Recreation',
    'Consumer Packaged Goods', 'Financial Services', 'Hospitality and Food Services',
    'Life Sciences and Healthcare', 'Manufacturing', 'Software and Information Technology', 'Other',
];

const COUNTIES = [
    'Beaver','Box Elder','Cache','Carbon','Daggett','Davis','Duchesne','Emery',
    'Garfield','Grand','Iron','Juab','Kane','Millard','Morgan','Piute','Rich',
    'Salt Lake','San Juan','Sanpete','Sevier','Summit','Tooele','Uintah',
    'Utah','Wasatch','Washington','Wayne','Weber',
];

const COMMUNITIES = [
    { value: 'none',    label: 'None / General' },
    { value: 'veteran', label: 'Veteran-Owned' },
    { value: 'women',   label: 'Woman-Owned' },
    { value: 'student', label: 'Student Entrepreneur' },
    { value: 'rural',   label: 'Rural Business' },
];

export default class FounderQuiz extends LightningElement {
    @track step = 1;
    @track profile = { stage: '', industry: '', county: '', community: '' };

    stages = STAGES;
    industries = INDUSTRIES;
    counties = COUNTIES;
    communities = COMMUNITIES;

    get currentStep() { return this.step; }
    get isStep1() { return this.step === 1; }
    get isStep2() { return this.step === 2; }
    get isStep3() { return this.step === 3; }
    get isStep4() { return this.step === 4; }

    get steps() {
        return [1,2,3,4].map(i => ({
            index: i,
            cls: 'progress-dot' + (i <= this.step ? ' active' : ''),
        }));
    }

    handleSelect(event) {
        const field = event.currentTarget.dataset.field;
        const value = event.currentTarget.dataset.value;
        this.profile = { ...this.profile, [field]: value };

        if (this.step < 4) {
            this.step++;
        } else {
            this.dispatchEvent(new CustomEvent('complete', { detail: { ...this.profile } }));
        }
    }
}
