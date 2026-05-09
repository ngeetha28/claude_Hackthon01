import { LightningElement, api, track } from 'lwc';
import chat from '@salesforce/apex/ChatController.chat';

export default class ChatAdvisor extends LightningElement {
    @api profile;
    @api resources = [];

    @track messages = [
        {
            id: 1,
            role: 'assistant',
            content: 'Hi! I\'m your Utah Founder\'s Navigator. Based on your profile, I\'ve matched you with the most relevant state resources. What specific challenge can I help you with today?',
            wrapCls: 'msg-wrap assistant',
            bubbleCls: 'bubble assistant',
        },
    ];
    @track inputValue = '';
    @track loading = false;
    _msgId = 2;

    get isSendDisabled() { return this.loading || !this.inputValue.trim(); }

    handleInput(e) { this.inputValue = e.target.value; }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
    }

    get resourceContext() {
        return (this.resources || []).map(r => `- ${r.Name}: ${r.Description__c} (${r.Link__c})`);
    }

    get apexMessages() {
        return this.messages.map(m => ({ role: m.role, content: m.content }));
    }

    async send() {
        if (this.isSendDisabled) return;
        const text = this.inputValue.trim();
        this.inputValue = '';

        this.messages = [...this.messages, {
            id: this._msgId++,
            role: 'user',
            content: text,
            wrapCls: 'msg-wrap user',
            bubbleCls: 'bubble user',
        }];

        this.loading = true;
        try {
            const reply = await chat({
                messages: this.apexMessages,
                stage: this.profile.stage,
                industry: this.profile.industry,
                county: this.profile.county,
                community: this.profile.community,
                resourceContext: this.resourceContext,
            });
            this.messages = [...this.messages, {
                id: this._msgId++,
                role: 'assistant',
                content: reply,
                wrapCls: 'msg-wrap assistant',
                bubbleCls: 'bubble assistant',
            }];
        } catch (err) {
            this.messages = [...this.messages, {
                id: this._msgId++,
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.',
                wrapCls: 'msg-wrap assistant',
                bubbleCls: 'bubble assistant',
            }];
        } finally {
            this.loading = false;
        }
    }
}
