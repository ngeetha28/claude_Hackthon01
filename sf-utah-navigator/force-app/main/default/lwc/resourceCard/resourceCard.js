import { LightningElement, api, track } from 'lwc';
import sendVerificationEmail from '@salesforce/apex/EmailVerificationController.sendVerificationEmail';

export default class ResourceCard extends LightningElement {
    @api resource;
    @track showEdit = false;
    @track email = '';
    @track domain = '';
    @track errorMsg = '';
    @track sent = false;
    @track isSending = false;

    get topicList() {
        return this.resource && this.resource.Topics__c
            ? this.resource.Topics__c.split('|').map(t => t.trim()).filter(Boolean)
            : [];
    }

    get sendLabel() { return this.isSending ? 'Sending…' : 'Send Verification Email'; }

    toggleEdit() { this.showEdit = !this.showEdit; }
    handleEmailChange(e) { this.email = e.target.value; }
    handleDomainChange(e) { this.domain = e.target.value; }

    async sendVerification() {
        this.isSending = true;
        this.errorMsg = '';
        try {
            await sendVerificationEmail({
                email: this.email,
                resourceId: this.resource.Id,
                companyDomain: this.domain,
            });
            this.sent = true;
        } catch (err) {
            this.errorMsg = err.body?.message || 'An error occurred. Please try again.';
        } finally {
            this.isSending = false;
        }
    }
}
