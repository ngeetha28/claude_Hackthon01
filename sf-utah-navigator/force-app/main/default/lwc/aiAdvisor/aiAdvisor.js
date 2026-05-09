import { LightningElement, track } from 'lwc';
import chat from '@salesforce/apex/ChatController.chat';

const SUGGESTIONS = [
    'What funding programs are available for early-stage startups in Utah?',
    'How do I find a co-working space in Salt Lake City?',
    'What legal resources exist for Utah founders?',
    'Which accelerators and incubators are in Utah County?',
    'How can I connect with other founders in my community?',
    'What grants are available for women-owned businesses in Utah?',
    'How do I apply for a SBIR/STTR grant?',
    'What networking events should I attend as a Utah founder?',
];

export default class AiAdvisor extends LightningElement {
    @track messages = [];
    @track inputText = '';
    @track isTyping = false;
    @track isSending = false;
    @track profile = { stage: '', industry: '', county: '', community: '' };

    msgIdCounter = 0;

    get suggestions() {
        return SUGGESTIONS.slice(0, 4);
    }

    get hasMessages() {
        return this.messages.length > 0;
    }

    handleProfile(event) {
        const field = event.target.dataset.field;
        this.profile = { ...this.profile, [field]: event.target.value };
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

    useSuggestion(event) {
        this.inputText = event.currentTarget.dataset.q;
        this.sendMessage();
    }

    sendMessage() {
        const text = (this.inputText || '').trim();
        if (!text || this.isSending) return;

        this.addMessage('user', text);
        this.inputText = '';
        this.isSending = true;
        this.isTyping = true;

        const apexMessages = this.messages.map(m => ({
            role: m.role,
            content: m.content,
        }));

        chat({
            messages: apexMessages,
            stage: this.profile.stage || 'any stage',
            industry: this.profile.industry || 'any industry',
            county: this.profile.county || 'any Utah county',
            community: this.profile.community || 'general',
            resourceContext: [],
        })
            .then(response => {
                this.isTyping = false;
                this.addMessage('assistant', response);
                this.isSending = false;
                this.scrollToBottom();
            })
            .catch(err => {
                this.isTyping = false;
                const msg = err && err.body ? err.body.message : 'Something went wrong. Please try again.';
                this.addMessage('assistant', msg);
                this.isSending = false;
            });
    }

    addMessage(role, content) {
        const id = ++this.msgIdCounter;
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isAssistant = role === 'assistant';
        this.messages = [
            ...this.messages,
            {
                id,
                role,
                content,
                time,
                isAssistant,
                wrapCls: `msg-wrap ${role}`,
                bubbleCls: `msg-bubble ${role}`,
            },
        ];
        this.scrollToBottom();
    }

    scrollToBottom() {
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            const el = this.template.querySelector('.messages-container');
            if (el) el.scrollTop = el.scrollHeight;
        }, 50);
    }
}
