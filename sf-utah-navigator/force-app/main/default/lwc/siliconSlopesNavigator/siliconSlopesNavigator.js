import { LightningElement, track } from 'lwc';
import chat from '@salesforce/apex/SiliconSlopesController.chat';

export default class SiliconSlopesNavigator extends LightningElement {
    @track isOpen = false;
    @track messages = [];
    @track inputText = '';
    @track isTyping = false;
    @track unreadCount = 1;

    msgIdCounter = 0;
    conversationHistory = [];

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
        this.inputText = '';
        this.startConversation();
    }

    startConversation() {
        this.isTyping = true;
        chat({ messages: [{ role: 'user', content: 'START' }], conversationHistory: '' })
            .then(response => {
                this.isTyping = false;
                this.addAgentMessage(response);
                this.conversationHistory.push(
                    { role: 'user', content: 'START' },
                    { role: 'assistant', content: response }
                );
            })
            .catch(() => {
                this.isTyping = false;
                this.addAgentMessage('Hi! I\'m the Silicon Slopes Navigator — here to help you find the right Utah business resources.\n\nTell me a bit about yourself. What kind of business are you working on?');
            });
    }

    handleInput(event) { this.inputText = event.target.value; }

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
        this.conversationHistory.push({ role: 'user', content: text });
        this.isTyping = true;

        chat({ messages: this.conversationHistory, conversationHistory: '' })
            .then(response => {
                this.isTyping = false;
                this.addAgentMessage(response);
                this.conversationHistory.push({ role: 'assistant', content: response });
                this.scrollToBottom();
            })
            .catch(err => {
                this.isTyping = false;
                this.addAgentMessage(err && err.body ? err.body.message : 'Something went wrong. Please try again.');
            });
    }

    addAgentMessage(content) {
        const id = ++this.msgIdCounter;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.messages = [...this.messages, {
            id, content, isAgent: true, time,
            wrapCls: 'msg-wrap agent', bubbleCls: 'msg-bubble agent',
        }];
        this.scrollToBottom();
    }

    addUserMessage(content) {
        const id = ++this.msgIdCounter;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.messages = [...this.messages, {
            id, content, isAgent: false, time,
            wrapCls: 'msg-wrap user', bubbleCls: 'msg-bubble user',
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
