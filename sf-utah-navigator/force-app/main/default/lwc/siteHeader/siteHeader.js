import { LightningElement } from 'lwc';

export default class SiteHeader extends LightningElement {
    handleNav(event) {
        event.preventDefault();
        const page = event.currentTarget.dataset.page;
        this.dispatchEvent(new CustomEvent('navigate', { detail: { page }, bubbles: true }));
    }
}
