import { LightningElement, track } from 'lwc';
import getFilteredResources from '@salesforce/apex/ResourceController.getFilteredResources';

const STAGE_LABELS = {
    idea: 'Idea Stage', early: 'Early Stage', revenue: 'Revenue Stage',
    scaling: 'Scaling', expanding: 'Expanding',
};

export default class ResourceDashboard extends LightningElement {
    @track profile = null;
    @track resources = [];
    @track isLoading = false;
    @track activeTab = 'resources';
    @track searchQuery = '';
    @track activeTopicFilter = 'All';

    get stageLabel() { return this.profile ? STAGE_LABELS[this.profile.stage] : ''; }
    get isResourcesTab() { return this.activeTab === 'resources'; }
    get isChatTab() { return this.activeTab === 'chat'; }

    get tabResourcesCls() { return 'tab-btn' + (this.isResourcesTab ? ' active' : ''); }
    get tabChatCls() { return 'tab-btn' + (this.isChatTab ? ' active' : ''); }

    get allTopics() {
        const topics = new Set(['All']);
        this.resources.forEach(r => {
            if (r.Topics__c) r.Topics__c.split('|').forEach(t => topics.add(t.trim()));
        });
        return Array.from(topics);
    }

    get topicsWithCls() {
        return this.allTopics.map(t => ({
            label: t,
            cls: 'topic-btn' + (this.activeTopicFilter === t ? ' active' : ''),
        }));
    }

    get filteredResources() {
        return this.resources.filter(r => {
            const matchTopic = this.activeTopicFilter === 'All' ||
                (r.Topics__c && r.Topics__c.includes(this.activeTopicFilter));
            const q = this.searchQuery.toLowerCase();
            const matchSearch = !q ||
                (r.Name && r.Name.toLowerCase().includes(q)) ||
                (r.Description__c && r.Description__c.toLowerCase().includes(q));
            return matchTopic && matchSearch;
        });
    }

    async handleQuizComplete(event) {
        this.profile = event.detail;
        this.isLoading = true;
        try {
            this.resources = await getFilteredResources({
                stage: this.profile.stage,
                industry: this.profile.industry,
                county: this.profile.county,
                community: this.profile.community,
            });
        } catch (err) {
            console.error('Error loading resources:', err);
        } finally {
            this.isLoading = false;
        }
    }

    reset() {
        this.profile = null;
        this.resources = [];
        this.activeTab = 'resources';
        this.searchQuery = '';
        this.activeTopicFilter = 'All';
    }

    showResources() { this.activeTab = 'resources'; }
    showChat() { this.activeTab = 'chat'; }
    handleSearch(e) { this.searchQuery = e.target.value; }
    handleTopicFilter(e) { this.activeTopicFilter = e.currentTarget.dataset.topic; }
}
