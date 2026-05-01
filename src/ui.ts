import { WTR_SVG } from './icon';

export interface DestroyerUi {
    launcher: HTMLButtonElement;
    panel: HTMLDivElement;
    modalOverlay: HTMLDivElement;
    modalTitle: HTMLHeadingElement;
    modalMessage: HTMLParagraphElement;
    selectMatch: HTMLSelectElement;
    inputField: HTMLInputElement;
    autocompleteBox: HTMLDivElement;
    blocklistEl: HTMLDivElement;
    countEl: HTMLSpanElement;
    profileSelect: HTMLSelectElement;
    profileNameInput: HTMLInputElement;
    profileSaveButton: HTMLButtonElement;
    profileLoadButton: HTMLButtonElement;
    profileDeleteButton: HTMLButtonElement;
    copyButton: HTMLButtonElement;
    importText: HTMLTextAreaElement;
    importButton: HTMLButtonElement;
    statusEl: HTMLDivElement;
    closeButton: HTMLButtonElement;
    addButton: HTMLButtonElement;
    purgeButton: HTMLSpanElement;
    modalCancelButton: HTMLButtonElement;
    modalConfirmButton: HTMLButtonElement;
    applyButton: HTMLButtonElement;
}

function getRequiredElement<T extends HTMLElement>(id: string, constructor: new () => T): T {
    const element = document.getElementById(id);

    if (!(element instanceof constructor)) {
        throw new Error(`Missing required UI element: #${id}`);
    }

    return element;
}

export function createDestroyerUi(): DestroyerUi {
    const launcher = document.createElement('button');
    launcher.id = 'dd-launcher';
    launcher.type = 'button';
    launcher.setAttribute('aria-label', 'Open Delulu Destroyer');
    launcher.innerHTML = `${WTR_SVG}<span>DESTROYER</span>`;
    document.body.appendChild(launcher);

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'dd-modal-overlay';
    modalOverlay.innerHTML = `
        <div id="dd-modal">
            <h3 id="dd-modal-title">Warning</h3>
            <p id="dd-modal-message">Are you sure you want to annihilate your current blocklist? Saved profiles stay intact.</p>
            <div class="dd-modal-btns">
                <button class="dd-btn" id="dd-modal-cancel">Cancel</button>
                <button class="dd-btn dd-btn-danger" id="dd-modal-confirm">ANNIHILATE</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    const panel = document.createElement('div');
    panel.id = 'dd-panel';
    panel.innerHTML = `
        <div id="dd-header">
            <div class="dd-title-wrap">${WTR_SVG}<h2>D. DESTROYER</h2></div>
            <button id="dd-close">✖</button>
        </div>
        <div class="dd-body">
            <select id="dd-match" class="dd-select">
                <option value="broad">Mode: Broad (Title, Tags, Genres)</option>
                <option value="strict">Mode: Strict (Tags & Genres Only)</option>
            </select>

            <div style="position: relative;">
                <div class="dd-input-wrap">
                    <input type="text" id="dd-input" class="dd-input" placeholder="Type a tag, genre, or word..." autocomplete="off">
                    <button class="dd-btn" id="dd-add">+</button>
                </div>
                <div id="dd-autocomplete"></div>
            </div>

            <div class="dd-list-header">
                <span>Active Blocklist (<span id="dd-count">0</span>)</span>
                <span class="dd-purge" id="dd-purge">Purge</span>
            </div>

            <div id="dd-blocklist"></div>

            <details class="dd-tools">
                <summary>Profiles & sharing</summary>
                <div class="dd-tool-group">
                    <select id="dd-profile-select" class="dd-select" aria-label="Saved blocklist profiles"></select>
                    <div class="dd-input-wrap">
                        <input type="text" id="dd-profile-name" class="dd-input" placeholder="Profile name..." autocomplete="off">
                        <button class="dd-btn" id="dd-profile-save">Save</button>
                    </div>
                    <div class="dd-action-row">
                        <button class="dd-btn" id="dd-profile-load">Load</button>
                        <button class="dd-btn" id="dd-profile-delete">Delete</button>
                    </div>
                </div>
                <div class="dd-tool-group">
                    <button class="dd-btn" id="dd-copy-blocklist">Copy blocklist</button>
                    <textarea id="dd-import-text" class="dd-textarea" placeholder="Paste a shared blocklist here..."></textarea>
                    <button class="dd-btn" id="dd-import-blocklist">Import & merge</button>
                    <div id="dd-status" role="status" aria-live="polite"></div>
                </div>
            </details>

            <button class="dd-btn primary" id="dd-apply" style="width: 100%; margin-top: 5px;">APPLY & DESTROY</button>
        </div>
    `;
    document.body.appendChild(panel);

    return {
        launcher,
        panel,
        modalOverlay,
        modalTitle: getRequiredElement('dd-modal-title', HTMLHeadingElement),
        modalMessage: getRequiredElement('dd-modal-message', HTMLParagraphElement),
        selectMatch: getRequiredElement('dd-match', HTMLSelectElement),
        inputField: getRequiredElement('dd-input', HTMLInputElement),
        autocompleteBox: getRequiredElement('dd-autocomplete', HTMLDivElement),
        blocklistEl: getRequiredElement('dd-blocklist', HTMLDivElement),
        countEl: getRequiredElement('dd-count', HTMLSpanElement),
        profileSelect: getRequiredElement('dd-profile-select', HTMLSelectElement),
        profileNameInput: getRequiredElement('dd-profile-name', HTMLInputElement),
        profileSaveButton: getRequiredElement('dd-profile-save', HTMLButtonElement),
        profileLoadButton: getRequiredElement('dd-profile-load', HTMLButtonElement),
        profileDeleteButton: getRequiredElement('dd-profile-delete', HTMLButtonElement),
        copyButton: getRequiredElement('dd-copy-blocklist', HTMLButtonElement),
        importText: getRequiredElement('dd-import-text', HTMLTextAreaElement),
        importButton: getRequiredElement('dd-import-blocklist', HTMLButtonElement),
        statusEl: getRequiredElement('dd-status', HTMLDivElement),
        closeButton: getRequiredElement('dd-close', HTMLButtonElement),
        addButton: getRequiredElement('dd-add', HTMLButtonElement),
        purgeButton: getRequiredElement('dd-purge', HTMLSpanElement),
        modalCancelButton: getRequiredElement('dd-modal-cancel', HTMLButtonElement),
        modalConfirmButton: getRequiredElement('dd-modal-confirm', HTMLButtonElement),
        applyButton: getRequiredElement('dd-apply', HTMLButtonElement),
    };
}
