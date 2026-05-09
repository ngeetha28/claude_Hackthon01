import { LightningElement, track } from 'lwc';
import chat from '@salesforce/apex/FoundersNavigatorController.chat';

// Onboarding quick-reply sets
const STEP_REPLIES = {
    1: ['Just exploring an idea', 'Pre-revenue startup', 'Recently launched', 'Growing business', 'Established business', 'Nonprofit', 'Freelancer / solo business'],
    2: ['SaaS / tech', 'Landscaping', 'Restaurant / food', 'Retail / ecommerce', 'Construction', 'Healthcare', 'Manufacturing', 'Creative services', 'Other'],
    3: ['Salt Lake County', 'Utah County', 'St. George', 'Ogden', 'Rural Utah', 'Statewide'],
    4: ['Funding', 'Grants', 'Startup mentoring', 'Registering a business', 'Licenses & permits', 'Hiring employees', 'Finding customers', 'Business planning', 'Taxes', 'Training'],
};


export default class FoundersNavigator extends LightningElement {
    @track isOpen = false;
    @track messages = [];
    @track inputText = '';
    @track isTyping = false;
    @track quickReplies = [];
    @track showQuickReplies = false;
    @track currentStep = 0; // 0=not started, 1-4=onboarding, 5=done
    @track unreadCount = 1;

    founderProfile = { stage: '', industry: '', location: '', goal: '' };
    msgIdCounter = 0;
    conversationHistory = [];

    get isOnboarding() { return this.currentStep >= 1 && this.currentStep <= 4; }
    get showProgress() { return this.isOnboarding; }
    get progressStyle() { return `width:${(this.currentStep / 4) * 100}%`; }
    get inputDisabled() { return this.isTyping && this.showQuickReplies; }
    get sendDisabled() { return this.isTyping || !(this.inputText || '').trim(); }

    openChat() {
        this.isOpen = true;
        this.unreadCount = 0;
        if (this.messages.length === 0) {
            this.startConversation();
        }
    }

    closeChat() { this.isOpen = false; }

    resetChat() {
        this.messages = [];
        this.conversationHistory = [];
        this.founderProfile = { stage: '', industry: '', location: '', goal: '' };
        this.currentStep = 0;
        this.quickReplies = [];
        this.showQuickReplies = false;
        this.inputText = '';
        this.startConversation();
    }

    startConversation() {
        this.currentStep = 1;
        this.conversationHistory = [];
        // Send the initial message via API to get the welcome + first question
        this.isTyping = true;
        const initMsg = [{ role: 'user', content: 'START' }];
        chat({ messages: initMsg, founderProfile: '' })
            .then(response => {
                this.isTyping = false;
                this.addAgentMessage(response);
                this.quickReplies = STEP_REPLIES[1];
                this.showQuickReplies = true;
                this.conversationHistory.push(
                    { role: 'user', content: 'START' },
                    { role: 'assistant', content: response }
                );
            })
            .catch(() => {
                this.isTyping = false;
                this.addAgentMessage('Welcome to The Founder\'s Navigator — I\'ll help you find the right Utah business resources in under 2 minutes.\n\nWhat stage best describes you?');
                this.quickReplies = STEP_REPLIES[1];
                this.showQuickReplies = true;
            });
    }

    useQuickReply(event) {
        const reply = event.currentTarget.dataset.reply;
        this.inputText = reply;
        this.sendMessage();
    }

    handleInput(event) {
        this.inputText = event.target.value;
    }

    handleKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    sendMessage() {
        const text = (this.inputText || '').trim();
        if (!text || this.isTyping) return;

        this.addUserMessage(text);
        this.inputText = '';
        this.showQuickReplies = false;
        this.quickReplies = [];

        // Update profile from onboarding steps
        if (this.currentStep === 1) {
            this.founderProfile.stage = text;
            this.currentStep = 2;
        } else if (this.currentStep === 2) {
            this.founderProfile.industry = text;
            this.currentStep = 3;
        } else if (this.currentStep === 3) {
            this.founderProfile.location = text;
            this.currentStep = 4;
        } else if (this.currentStep === 4) {
            this.founderProfile.goal = text;
            this.currentStep = 5;
        }

        this.conversationHistory.push({ role: 'user', content: text });
        this.isTyping = true;

        const profileStr = this.buildProfileString();

        chat({
            messages: this.conversationHistory,
            founderProfile: profileStr,
        })
            .then(response => {
                this.isTyping = false;
                this.addAgentMessage(response);
                this.conversationHistory.push({ role: 'assistant', content: response });

                // Show next step quick replies during onboarding
                if (this.currentStep >= 2 && this.currentStep <= 4) {
                    this.quickReplies = STEP_REPLIES[this.currentStep];
                    this.showQuickReplies = true;
                } else if (this.currentStep === 5) {
                    // Post-recommendation follow-ups
                    this.quickReplies = ['Tell me more about the first one', 'Show me funding options', 'What about mentoring?', 'Start over with new answers'];
                    this.showQuickReplies = true;
                }
                this.scrollToBottom();
            })
            .catch(err => {
                this.isTyping = false;
                const msg = err && err.body ? err.body.message : 'Something went wrong. Please try again.';
                this.addAgentMessage(msg);
            });
    }

    buildProfileString() {
        const p = this.founderProfile;
        const parts = [];
        if (p.stage) parts.push('Stage: ' + p.stage);
        if (p.industry) parts.push('Industry: ' + p.industry);
        if (p.location) parts.push('Location: ' + p.location);
        if (p.goal) parts.push('Current goal: ' + p.goal);
        return parts.join('\n');
    }

    addAgentMessage(content) {
        const id = ++this.msgIdCounter;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.messages = [...this.messages, {
            id, content,
            role: 'assistant',
            isAgent: true,
            time,
            wrapCls: 'msg-wrap agent',
            bubbleCls: 'msg-bubble agent',
        }];
        this.scrollToBottom();
    }

    addUserMessage(content) {
        const id = ++this.msgIdCounter;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.messages = [...this.messages, {
            id, content,
            role: 'user',
            isAgent: false,
            time,
            wrapCls: 'msg-wrap user',
            bubbleCls: 'msg-bubble user',
        }];
    }

    scrollToBottom() {
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            const el = this.template.querySelector('.messages-area');
            if (el) el.scrollTop = el.scrollHeight;
        }, 60);
    }
}
