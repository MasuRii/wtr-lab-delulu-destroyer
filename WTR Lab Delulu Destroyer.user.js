// ==UserScript==
// @name         WTR Lab Delulu Destroyer
// @namespace    https://docs.scriptcat.org/en/
// @version      4.7
// @description  A lightweight, floating, ultra-fast novel purger for WTR Lab.
// @author       MasuRii
// @match        https://wtr-lab.com/*
// @exclude      *://wtr-lab.com/*/novel/*/chapter-*
// @exclude      *://wtr-lab.com/*/library*
// @exclude      *://wtr-lab.com/*/news*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wtr-lab.com
// @license      MIT
// @compatible   scriptcat
// @compatible   violentmonkey
// @compatible   tampermonkey
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/constants.ts
const SCRIPT_VERSION = '4.7';
const STORAGE_KEYS = {
    savedItems: 'wtr_saved_items',
    matchMode: 'wtr_match_mode',
};
const DEFAULT_MATCH_MODE = 'broad';
const NEXT_BUILD_ID_FALLBACK = 'B_iTIc03bagM1u-Uo_553';
const TARGET_SELECTORS = '.list-item, .rank-item, .serie-item, .image-wrap.zoom, .rec-item, .recent-item';
const WTR_GENRES = [
    'action',
    'adult',
    'adventure',
    'comedy',
    'drama',
    'ecchi',
    'erciyuan',
    'fan-fiction',
    'fantasy',
    'game',
    'gender-bender',
    'harem',
    'historical',
    'horror',
    'josei',
    'martial-arts',
    'mature',
    'mecha',
    'military',
    'mystery',
    'psychological',
    'romance',
    'school-life',
    'sci-fi',
    'seinen',
    'shoujo',
    'shoujo-ai',
    'shounen',
    'shounen-ai',
    'slice-of-life',
    'smut',
    'sports',
    'supernatural',
    'tragedy',
    'urban-life',
    'wuxia',
    'xianxia',
    'xuanhuan',
    'yaoi',
    'yuri',
];

;// ./src/routes.ts

function isExcludedPage() {
    const path = window.location.pathname;
    if (/\/novel\/.*\/chapter-/i.test(path)) {
        return true;
    }
    if (path.includes('/library') || path.includes('/news')) {
        return true;
    }
    return path.includes('/profile/') && !path.includes('/profile/vote-serie');
}
function getNextBuildId() {
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (!nextDataScript?.textContent) {
        return NEXT_BUILD_ID_FALLBACK;
    }
    try {
        const nextData = JSON.parse(nextDataScript.textContent);
        return nextData.buildId ?? NEXT_BUILD_ID_FALLBACK;
    }
    catch {
        return NEXT_BUILD_ID_FALLBACK;
    }
}

;// ./src/tags.ts
function findTags(payload) {
    if (!payload || typeof payload !== 'object') {
        return null;
    }
    const candidate = payload;
    if (candidate.tags?.ungrouped && Array.isArray(candidate.tags.ungrouped)) {
        return candidate.tags.ungrouped;
    }
    for (const value of Object.values(candidate)) {
        const result = findTags(value);
        if (result) {
            return result;
        }
    }
    return null;
}

;// ./src/userscript-api.ts
const runtime = globalThis;
function addStyle(css) {
    if (typeof runtime.GM_addStyle === 'function') {
        runtime.GM_addStyle(css);
        return;
    }
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}
function getValue(key, defaultValue) {
    if (typeof runtime.GM_getValue === 'function') {
        return runtime.GM_getValue(key, defaultValue);
    }
    return localStorage.getItem(key) ?? defaultValue;
}
function setValue(key, value) {
    if (typeof runtime.GM_setValue === 'function') {
        runtime.GM_setValue(key, value);
        return;
    }
    localStorage.setItem(key, value);
}

;// ./src/app.ts




class DeluluDestroyerApp {
    constructor(ui) {
        this.ui = ui;
        this.allApiTags = [];
        this.uiHiddenByRoute = false;
        this.savedItems = this.loadSavedItems();
        this.matchMode = this.loadMatchMode();
        this.ui.selectMatch.value = this.matchMode;
    }
    async init() {
        this.renderList();
        this.bindEvents();
        this.bindRouteAndMutationHandlers();
        await this.loadApiTags();
        this.executeDestroyer();
    }
    loadSavedItems() {
        try {
            const parsed = JSON.parse(getValue(STORAGE_KEYS.savedItems, '[]'));
            return Array.isArray(parsed) ? parsed.filter(this.isBlockItem) : [];
        }
        catch {
            return [];
        }
    }
    loadMatchMode() {
        const value = getValue(STORAGE_KEYS.matchMode, DEFAULT_MATCH_MODE);
        return value === 'strict' ? 'strict' : 'broad';
    }
    isBlockItem(item) {
        if (!item || typeof item !== 'object') {
            return false;
        }
        const candidate = item;
        return ((typeof candidate.id === 'string' || typeof candidate.id === 'number') &&
            typeof candidate.label === 'string' &&
            (candidate.type === 'genre' || candidate.type === 'tag' || candidate.type === 'custom'));
    }
    updateStorage() {
        setValue(STORAGE_KEYS.savedItems, JSON.stringify(this.savedItems));
        setValue(STORAGE_KEYS.matchMode, this.matchMode);
    }
    executeDestroyer() {
        if (isExcludedPage()) {
            if (!this.uiHiddenByRoute) {
                this.ui.launcher.style.display = 'none';
                this.ui.panel.style.display = 'none';
                this.uiHiddenByRoute = true;
            }
            return;
        }
        if (this.uiHiddenByRoute) {
            this.ui.launcher.style.display = 'flex';
            this.uiHiddenByRoute = false;
        }
        if (this.savedItems.length === 0) {
            return;
        }
        const blockWords = this.savedItems.map((item) => item.label.toLowerCase());
        const elements = document.querySelectorAll(TARGET_SELECTORS);
        elements.forEach((element) => {
            const container = this.getDestroyContainer(element);
            if (container.style.display === 'none') {
                return;
            }
            const textToCheck = this.getTitleText(container);
            const metaTags = Array.from(container.querySelectorAll('.genre, .tag'))
                .map((tag) => tag.textContent?.toLowerCase() ?? '');
            const shouldDestroy = this.matchMode === 'broad'
                ? blockWords.some((word) => textToCheck.includes(word) || metaTags.includes(word))
                : blockWords.some((word) => metaTags.includes(word));
            if (shouldDestroy) {
                container.style.setProperty('display', 'none', 'important');
            }
        });
    }
    getDestroyContainer(element) {
        const cardWrapper = element.closest('.card');
        if (!cardWrapper) {
            return element;
        }
        const itemsInCard = cardWrapper.querySelectorAll('.serie-item, .list-item, .rank-item, .rec-item, .recent-item');
        return itemsInCard.length === 1 ? cardWrapper : element;
    }
    getTitleText(container) {
        const titleNode = container.querySelector('.title, [title], .rawtitle');
        if (titleNode) {
            return (titleNode.getAttribute('title') ?? titleNode.textContent ?? '').toLowerCase();
        }
        return (container.getAttribute('title') ?? '').toLowerCase();
    }
    bindRouteAndMutationHandlers() {
        const originalPushState = history.pushState.bind(history);
        const originalReplaceState = history.replaceState.bind(history);
        history.pushState = ((data, unused, url) => {
            originalPushState(data, unused, url);
            window.setTimeout(() => this.executeDestroyer(), 100);
        });
        history.replaceState = ((data, unused, url) => {
            originalReplaceState(data, unused, url);
            window.setTimeout(() => this.executeDestroyer(), 100);
        });
        window.addEventListener('popstate', () => window.setTimeout(() => this.executeDestroyer(), 100));
        const observer = new MutationObserver(() => {
            if (this.destroyTimeoutId !== undefined) {
                window.clearTimeout(this.destroyTimeoutId);
            }
            this.destroyTimeoutId = window.setTimeout(() => this.executeDestroyer(), 250);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    renderList() {
        this.ui.blocklistEl.innerHTML = '';
        this.savedItems.forEach((item) => {
            const pill = document.createElement('div');
            pill.className = `dd-pill type-${item.type}`;
            const icon = document.createElement('span');
            icon.className = 'dd-pill-icon';
            icon.textContent = this.getPillIcon(item.type);
            const label = document.createElement('span');
            label.textContent = item.label;
            const removeButton = document.createElement('button');
            removeButton.className = 'dd-remove';
            removeButton.type = 'button';
            removeButton.textContent = '×';
            removeButton.addEventListener('click', () => {
                this.savedItems = this.savedItems.filter((savedItem) => savedItem.id !== item.id);
                this.updateStorage();
                this.renderList();
                this.executeDestroyer();
            });
            pill.append(icon, label, removeButton);
            this.ui.blocklistEl.appendChild(pill);
        });
        this.ui.countEl.textContent = String(this.savedItems.length);
        if (this.savedItems.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'dd-empty';
            empty.textContent = 'No targets acquired.';
            this.ui.blocklistEl.appendChild(empty);
        }
    }
    getPillIcon(type) {
        if (type === 'genre') {
            return 'G';
        }
        if (type === 'tag') {
            return '#';
        }
        return '*';
    }
    getSuggestions(query) {
        if (!query) {
            return [];
        }
        const lowerQuery = query.toLowerCase();
        const savedLabels = this.savedItems.map((item) => item.label.toLowerCase());
        const genreMatches = WTR_GENRES
            .filter((genre) => genre.toLowerCase().includes(lowerQuery) && !savedLabels.includes(genre.toLowerCase()))
            .map((genre) => ({ label: genre, type: 'genre', id: `g_${genre.toLowerCase()}` }));
        const tagMatches = this.allApiTags
            .filter((tag) => tag.label.toLowerCase().includes(lowerQuery) && !savedLabels.includes(tag.label.toLowerCase()))
            .map((tag) => ({ label: tag.label, type: 'tag', id: tag.value }));
        return [...genreMatches, ...tagMatches].slice(0, 15);
    }
    renderAutocomplete() {
        const query = this.ui.inputField.value.trim();
        const suggestions = this.getSuggestions(query);
        if (suggestions.length === 0) {
            this.ui.autocompleteBox.style.display = 'none';
            return;
        }
        this.ui.autocompleteBox.innerHTML = '';
        suggestions.forEach((suggestion) => {
            const item = document.createElement('div');
            item.className = 'dd-ac-item';
            const label = document.createElement('span');
            label.textContent = suggestion.label;
            const type = document.createElement('span');
            type.className = 'dd-ac-type';
            type.textContent = suggestion.type;
            item.append(label, type);
            item.addEventListener('click', () => {
                this.ui.inputField.value = suggestion.label;
                this.addWord();
                this.ui.autocompleteBox.style.display = 'none';
            });
            this.ui.autocompleteBox.appendChild(item);
        });
        this.ui.autocompleteBox.style.display = 'block';
    }
    addWord() {
        const value = this.ui.inputField.value.trim();
        if (!value) {
            return;
        }
        if (this.savedItems.some((item) => item.label.toLowerCase() === value.toLowerCase())) {
            this.ui.inputField.value = '';
            this.ui.autocompleteBox.style.display = 'none';
            return;
        }
        let type = 'custom';
        let label = value;
        let id = `c_${Date.now()}`;
        if (WTR_GENRES.includes(value.toLowerCase())) {
            type = 'genre';
            id = `g_${value.toLowerCase()}`;
        }
        else {
            const foundTag = this.allApiTags.find((tag) => tag.label.toLowerCase() === value.toLowerCase() || String(tag.value) === value);
            if (foundTag) {
                type = 'tag';
                label = foundTag.label;
                id = foundTag.value;
            }
        }
        this.savedItems.push({ id, label, type });
        this.updateStorage();
        this.renderList();
        this.ui.inputField.value = '';
        this.ui.autocompleteBox.style.display = 'none';
    }
    bindEvents() {
        this.ui.launcher.addEventListener('click', () => {
            this.ui.panel.style.display = 'flex';
            this.ui.launcher.style.display = 'none';
            this.ui.inputField.focus();
        });
        this.ui.closeButton.addEventListener('click', () => {
            this.ui.panel.style.display = 'none';
            this.ui.launcher.style.display = 'flex';
            this.ui.autocompleteBox.style.display = 'none';
        });
        this.ui.selectMatch.addEventListener('change', () => {
            this.matchMode = this.ui.selectMatch.value === 'strict' ? 'strict' : 'broad';
            this.updateStorage();
        });
        this.ui.inputField.addEventListener('input', () => this.renderAutocomplete());
        this.ui.inputField.addEventListener('focus', () => this.renderAutocomplete());
        this.ui.addButton.addEventListener('click', () => this.addWord());
        this.ui.inputField.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.addWord();
            }
        });
        document.addEventListener('click', (event) => {
            if (event.target !== this.ui.inputField && event.target !== this.ui.autocompleteBox) {
                this.ui.autocompleteBox.style.display = 'none';
            }
        });
        this.ui.purgeButton.addEventListener('click', () => {
            this.ui.modalOverlay.style.display = 'flex';
        });
        this.ui.modalCancelButton.addEventListener('click', () => {
            this.ui.modalOverlay.style.display = 'none';
        });
        this.ui.modalConfirmButton.addEventListener('click', () => {
            this.savedItems = [];
            this.updateStorage();
            this.renderList();
            this.executeDestroyer();
            this.ui.modalOverlay.style.display = 'none';
        });
        this.ui.applyButton.addEventListener('click', () => {
            this.addWord();
            this.executeDestroyer();
            this.ui.panel.style.display = 'none';
            this.ui.launcher.style.display = 'flex';
        });
    }
    async loadApiTags() {
        try {
            const response = await fetch(`https://wtr-lab.com/_next/data/${getNextBuildId()}/en/novel-finder.json?locale=en`);
            if (!response.ok) {
                return;
            }
            const payload = await response.json();
            const ungrouped = findTags(payload);
            if (ungrouped) {
                this.allApiTags = ungrouped;
            }
        }
        catch {
            console.log('Delulu Destroyer: Running without API tag autocompletion.');
        }
    }
}

;// ./src/styles.ts
const DESTROYER_STYLES = `
        :root {
            --dd-bg: #0d1117; --dd-pane: #161b22; --dd-text: #c9d1d9;
            --dd-accent: #00ffff; --dd-crimson: #ff0055; 
            --dd-tag: #00ffff; --dd-genre: #ff7b72; --dd-custom: #a371f7;
            --dd-border: #30363d;
        }

        /* Launcher Button */
        #dd-launcher {
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            background: var(--dd-bg); border: 2px solid var(--dd-crimson);
            border-radius: 50px; padding: 8px 16px; display: flex; align-items: center; gap: 8px;
            cursor: pointer; box-shadow: 0 4px 15px rgba(255, 0, 85, 0.3);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        #dd-launcher:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 0, 85, 0.5); }
        #dd-launcher span { color: var(--dd-text); font-family: monospace; font-weight: bold; font-size: 13px; }

        /* Floating Panel */
        #dd-panel {
            position: fixed; bottom: 80px; right: 20px; width: 340px; z-index: 10000;
            background: rgba(13, 17, 23, 0.95); backdrop-filter: blur(8px);
            border: 1px solid var(--dd-border); border-radius: 16px;
            display: none; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; overflow: visible;
        }

        /* Header */
        #dd-header {
            background: var(--dd-pane); padding: 12px 16px; border-bottom: 1px solid var(--dd-border);
            border-radius: 16px 16px 0 0; display: flex; justify-content: space-between; align-items: center;
        }
        .dd-title-wrap { display: flex; align-items: center; gap: 8px; }
        .dd-title-wrap h2 { margin: 0; font-size: 14px; color: var(--dd-text); letter-spacing: 1px; font-weight: bold; }
        #dd-close { background: transparent; border: none; color: #8b949e; cursor: pointer; font-size: 16px; transition: color 0.2s; }
        #dd-close:hover { color: var(--dd-crimson); }

        /* Body Area */
        .dd-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; position: relative; }

        .dd-select, .dd-input {
            width: 100%; background: var(--dd-bg); border: 1px solid var(--dd-border);
            color: var(--dd-text); border-radius: 8px; padding: 8px 10px; font-size: 12px; outline: none;
        }
        .dd-select:focus, .dd-input:focus { border-color: var(--dd-accent); }

        .dd-input-wrap { display: flex; gap: 6px; position: relative; }
        .dd-btn {
            background: var(--dd-pane); border: 1px solid var(--dd-border); color: var(--dd-text);
            border-radius: 8px; padding: 8px 12px; cursor: pointer; font-size: 12px; font-weight: bold; transition: 0.2s;
        }
        .dd-btn:hover { border-color: var(--dd-accent); color: var(--dd-accent); }
        .dd-btn.primary { background: var(--dd-accent); color: #000; border: none; }
        .dd-btn.primary:hover { background: #00cccc; }

        /* Autocomplete Dropdown */
        #dd-autocomplete {
            position: absolute; top: calc(100% + 4px); left: 0; width: calc(100% - 40px);
            background: var(--dd-bg); border: 1px solid var(--dd-border); border-radius: 8px;
            max-height: 180px; overflow-y: auto; z-index: 10001; display: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.8);
        }
        #dd-autocomplete::-webkit-scrollbar { width: 4px; }
        #dd-autocomplete::-webkit-scrollbar-thumb { background: var(--dd-border); border-radius: 4px; }
        .dd-ac-item {
            padding: 8px 12px; cursor: pointer; color: var(--dd-text); font-size: 12px;
            border-bottom: 1px solid var(--dd-border); display: flex; justify-content: space-between;
        }
        .dd-ac-item:hover { background: var(--dd-pane); color: var(--dd-accent); }
        .dd-ac-item:last-child { border-bottom: none; }
        .dd-ac-type { font-size: 10px; color: #8b949e; text-transform: uppercase; }

        /* Blocklist Display */
        .dd-list-header { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #8b949e; text-transform: uppercase; font-weight: bold; }
        .dd-purge { color: var(--dd-crimson); cursor: pointer; transition: 0.2s; }
        .dd-purge:hover { text-shadow: 0 0 5px var(--dd-crimson); }

        #dd-blocklist {
            display: flex; flex-wrap: wrap; gap: 6px; max-height: 200px; overflow-y: auto;
            padding-right: 4px; padding-bottom: 4px;
        }
        #dd-blocklist::-webkit-scrollbar { width: 4px; }
        #dd-blocklist::-webkit-scrollbar-thumb { background: var(--dd-border); border-radius: 4px; }

        /* Cute Pills */
        .dd-pill {
            background: var(--dd-bg); border: 1px solid var(--dd-border); border-radius: 20px;
            padding: 4px 10px; display: inline-flex; align-items: center; gap: 6px; font-size: 11px;
            user-select: none; transition: border-color 0.2s;
        }
        .dd-pill:hover { border-color: #8b949e; }
        .dd-pill-icon { font-weight: bold; }
        .dd-pill.type-genre .dd-pill-icon { color: var(--dd-genre); }
        .dd-pill.type-tag .dd-pill-icon { color: var(--dd-tag); }
        .dd-pill.type-custom .dd-pill-icon { color: var(--dd-custom); }
        .dd-remove { background: none; border: none; color: #8b949e; cursor: pointer; font-size: 14px; padding: 0; line-height: 1; }
        .dd-remove:hover { color: var(--dd-crimson); }
        .dd-empty { font-size: 11px; color: #8b949e; font-style: italic; width: 100%; text-align: center; padding: 10px 0; }

        /* Custom Modal */
        #dd-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
            z-index: 20000; display: none; justify-content: center; align-items: center;
        }
        #dd-modal {
            background: var(--dd-pane); border: 1px solid var(--dd-crimson);
            border-radius: 12px; width: 300px; padding: 24px; text-align: center;
            box-shadow: 0 0 30px rgba(255, 0, 85, 0.2); font-family: 'Segoe UI', Tahoma, sans-serif;
        }
        #dd-modal h3 { margin: 0 0 10px 0; color: var(--dd-crimson); font-size: 16px; font-weight: bold; text-transform: uppercase; }
        #dd-modal p { margin: 0 0 24px 0; color: var(--dd-text); font-size: 13px; line-height: 1.4; }
        .dd-modal-btns { display: flex; gap: 12px; justify-content: center; }
        .dd-btn-danger { background: var(--dd-crimson); color: #fff; border: none; }
        .dd-btn-danger:hover { background: #ff1a66; box-shadow: 0 0 10px rgba(255, 0, 85, 0.5); }
`;

;// ./src/icon.ts
const WTR_SVG = `<svg width="20" height="20" viewBox="0 0 512 512" fill="var(--dd-crimson)"><path d="M111.155 160.828c-3.042 4.341-5.697 9.139-7.873 14.218a87 87 0 0 0-1.948 4.925l-.062.172s-.267.813-.375 1.134a87 87 0 0 0-.542 1.653l-.086.287a154 154 0 0 1-.501 1.697l-.086.298a108 108 0 0 0-1.038 4.259l-.485 2.326c-.182.974-.363 1.95-.511 2.922-.308 1.987-.541 4.133-.715 6.602-.06.915-.12 1.86-.151 2.769a76 76 0 0 0-.002 5.276q.025.928.072 1.831l-.115.115.531 4.776q.097.868.217 1.743l.879 7.126h.455q.063.27.128.53c.209.865.42 1.727.656 2.565.187.716.395 1.452.606 2.17.119.456.247.83.344 1.094.449 1.476.925 2.83 1.447 4.121.226.635.544 1.48.956 2.374a77 77 0 0 0 5.191 10.225l11.25 18.624 1.598 2.697.879 1.413 1.045 1.751 4.34 7.197 9.06 14.983 32.641-51.534.36-.613 1.93-2.993 5.37-8.545 23.01-36.365a74 74 0 0 0 4.559-8.363 78 78 0 0 0 3.121-7.667c.33-.953.62-1.904.92-2.856l.04-.128a75.8 75.8 0 0 0 3.13-21.639V18zm303.865 38.938a12 12 0 0 0-.12-1.262c-.02-.223-.05-.506-.1-.83a45 45 0 0 0-.66-4.576c-.02-.126-.05-.25-.08-.373v-3.172l-.87-.856c-.06-.269-.12-.539-.19-.814-.17-.681-.34-1.338-.54-2.015-.2-.814-.42-1.606-.65-2.396l-.03-.124a97 97 0 0 0-1.19-3.733l-.04-.132c-.32-.892-.67-1.752-.98-2.519a79 79 0 0 0-8.65-16.134L300.86 17.94v136.058c0 8.219 1.24 16.233 3.69 23.818l.03.096c.26.794.53 1.588.82 2.382a63 63 0 0 0 3.17 7.486 75 75 0 0 0 3.88 6.878l57.74 91.177h11.22l22.53-37.818c8.76-14.581 12.6-31.262 11.08-48.251" style="fill-opacity:0.3"></path><path d="M442.17 461.082c-8.23 14.426-22.52 23.172-38.99 23.172H109.01c-16.444 0-31.031-8.746-38.997-23.172-7.859-14.318-7.079-31.651 1.534-45.08l72.424-113.98.377-.888 22.792-36.145 7.94 8.693c5.22 5.598 13.94 6.083 19.65 1.023l29.5-25.945 26.59 30.655c1.26 1.507 3.69 1.749 5.7 1.749 1.89 0 4.31-1.399 5.57-2.906l25.06-28.879.51-.619 29.53 25.945c5.68 5.06 14.56 4.575 19.62-1.023l8.13-8.639.88 1.427 21.4 33.911.51.753 72.94 114.868c8.61 13.429 9.12 30.385 1.5 45.08M116.627 242.893c-.404-.753-.781-1.372-1.157-2.018-.377-.754-.889-1.534-1.131-2.154a82 82 0 0 1-2.045-4.44c-.081-.162-.135-.35-.189-.512a18 18 0 0 1-.753-1.884 39 39 0 0 1-1.319-3.767c-.054-.162-.135-.324-.161-.485a65 65 0 0 1-.619-2.207c-.216-.753-.404-1.534-.592-2.314-.189-.754-.35-1.535-.512-2.315a87 87 0 0 1-.942-5.813s.027-.027 0-.027c-.215-1.965-.376-3.903-.43-5.867a67 67 0 0 1 0-4.656c.027-.808.08-1.642.134-2.45.135-1.911.323-3.821.619-5.732.135-.888.296-1.75.458-2.611l.403-1.938c.296-1.291.593-2.583.942-3.875.189-.619.377-1.265.565-1.911.27-.861.566-1.696.835-2.53a77 77 0 0 1 1.722-4.36c1.884-4.306 4.172-8.451 6.944-12.38L201.4 49.734l.059-.081v104.344c0 6.325-.89 12.542-2.669 18.49-.02.108-.05.188-.101.296-.25.861-.509 1.75-.839 2.584a56 56 0 0 1-2.23 5.732c-.161.323-.32.619-.49.942-.561 1.077-1.07 2.154-1.66 3.23a67 67 0 0 1-2.401 4.064l-22.899 36.333-5.33 8.478-2.05 3.176-.37.646-15.318 24.061-7.348 11.492-1.265 2.045-.242-.376-.431-.646-.726-1.131-3.607-6.055-1.076-1.804-.808-1.291-1.345-2.234-.296-.539-.216-.349-1.103-1.831zm204.243-53.558a63 63 0 0 1-3.36-6.029 53 53 0 0 1-2.69-6.378c-.27-.727-.54-1.454-.75-2.18-2.13-6.594-3.21-13.565-3.21-20.751V49.653l81.79 116.994c1.54 2.287 3.04 4.575 4.34 6.971 1.18 2.314 2.28 4.736 3.28 7.024.3.727.59 1.453.86 2.207.4 1.076.7 2.207 1.05 3.31.4 1.373.81 2.772 1.13 4.199.14.511.22.996.32 1.507.11.511.22 1.023.3 1.534.05.108.08.161.11.242 0 .027 0 .081.02.108v.134c.03.054.06.135.06.216.03.107.05.215.08.323.03.161.08.323.11.511a32 32 0 0 1 .4 3.149c.05.269.11.565.16.834.06.269.08.566.11.835.05.296.05.619.08.915.03.269.03.538.03.807 1.13 14.184-2.18 28.636-9.77 41.42l-19.62 32.942-19.11-30.035-6.97-11.142zm136.89 215.793-69.9-110.319 24.82-41.635c18.22-30.412 16.82-69.033-3.42-98.288L309.09 11.651c-1.91-2.503-5.06-4.171-8.35-4.171-1.02 0-2.02.269-3.04.511-4.33 1.265-7.1 5.06-7.1 9.635v136.371c0 16.579 4.57 32.539 13.18 45.969l28.24 44.569 5.41 8.558c-.35.243-.7.539-1 .862l-10.12 10.496-29.01-25.945c-2.77-2.53-6.33-3.822-10.26-3.552-3.79.242-7.21 2.045-9.63 4.817l-1.27 1.4-20.1 23.28-21.42-24.68c-2.53-2.772-5.95-4.575-9.75-4.817-3.93-.27-7.34 1.022-10.14 3.552l-29.5 25.945-9.74-10.496c-.3-.296-.57-.539-.89-.781l1.29-1.911 1.24-1.911 4.569-7.347.521-.754 26.07-41.285c8.75-13.538 13.17-29.39 13.17-45.969V17.626c0-4.575-2.64-8.37-6.98-9.635-.99-.242-2.01-.511-3.28-.511-3.15 0-6.32 1.668-8.1 4.171L102.82 154.886c-20.266 29.255-21.8 67.876-3.552 98.288l25.083 41.635L54.43 405.128c-12.919 20.239-13.673 44.919-2.019 65.939 11.519 20.912 32.781 33.453 56.599 33.453h294.17c23.95 0 45.08-12.541 56.62-33.453 11.39-21.127 10.61-45.942-2.04-65.939"></path><path d="M223.26 364.678c0 16.53-13.4 29.93-29.931 29.93-16.529 0-29.929-13.4-29.929-29.93 0-16.529 13.4-29.929 29.929-29.929 16.531 0 29.931 13.4 29.931 29.929m125.38.228c0 16.529-13.4 29.929-29.93 29.929s-29.93-13.4-29.93-29.929c0-16.53 13.4-29.93 29.93-29.93s29.93 13.4 29.93 29.93"></path></svg>`;

;// ./src/ui.ts

function getRequiredElement(id, constructor) {
    const element = document.getElementById(id);
    if (!(element instanceof constructor)) {
        throw new Error(`Missing required UI element: #${id}`);
    }
    return element;
}
function createDestroyerUi() {
    const launcher = document.createElement('div');
    launcher.id = 'dd-launcher';
    launcher.innerHTML = `${WTR_SVG}<span>DESTROYER</span>`;
    document.body.appendChild(launcher);
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'dd-modal-overlay';
    modalOverlay.innerHTML = `
        <div id="dd-modal">
            <h3>Warning</h3>
            <p>Are you sure you want to annihilate your entire blocklist? This cannot be undone.</p>
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

            <button class="dd-btn primary" id="dd-apply" style="width: 100%; margin-top: 5px;">APPLY & DESTROY</button>
        </div>
    `;
    document.body.appendChild(panel);
    return {
        launcher,
        panel,
        modalOverlay,
        selectMatch: getRequiredElement('dd-match', HTMLSelectElement),
        inputField: getRequiredElement('dd-input', HTMLInputElement),
        autocompleteBox: getRequiredElement('dd-autocomplete', HTMLDivElement),
        blocklistEl: getRequiredElement('dd-blocklist', HTMLDivElement),
        countEl: getRequiredElement('dd-count', HTMLSpanElement),
        closeButton: getRequiredElement('dd-close', HTMLButtonElement),
        addButton: getRequiredElement('dd-add', HTMLButtonElement),
        purgeButton: getRequiredElement('dd-purge', HTMLSpanElement),
        modalCancelButton: getRequiredElement('dd-modal-cancel', HTMLButtonElement),
        modalConfirmButton: getRequiredElement('dd-modal-confirm', HTMLButtonElement),
        applyButton: getRequiredElement('dd-apply', HTMLButtonElement),
    };
}

;// ./src/index.ts




function bootstrap() {
    addStyle(DESTROYER_STYLES);
    const ui = createDestroyerUi();
    const app = new DeluluDestroyerApp(ui);
    void app.init();
}
if (document.body) {
    bootstrap();
}
else {
    window.addEventListener('DOMContentLoaded', bootstrap, { once: true });
}

/******/ })()
;