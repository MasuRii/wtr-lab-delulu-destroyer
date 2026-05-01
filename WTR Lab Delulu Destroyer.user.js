// ==UserScript==
// @name         WTR Lab Delulu Destroyer
// @namespace    https://docs.scriptcat.org/en/
// @version      5.0
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
// @compatible   stay
// @compatible   tampermonkey
// @run-at       document-end
// @noframes
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/constants.ts
const SCRIPT_VERSION = '5.0';
const STORAGE_KEYS = {
    savedItems: 'wtr_saved_items',
    matchMode: 'wtr_match_mode',
    profiles: 'wtr_profiles',
};
const DEFAULT_MATCH_MODE = 'broad';
const SHARE_PAYLOAD_APP = 'wtr-delulu-destroyer';
const SHARE_PAYLOAD_VERSION = 1;
const NEXT_BUILD_ID_FALLBACK = 'B_iTIc03bagM1u-Uo_553';
const TARGET_SELECTORS = '.list-item, .rank-item, .serie-item, .image-wrap.zoom, .rec-item, .recent-item';
const HIDDEN_ATTRIBUTE = 'data-dd-hidden';
const PREVIOUS_DISPLAY_ATTRIBUTE = 'data-dd-previous-display';
const PREVIOUS_DISPLAY_PRIORITY_ATTRIBUTE = 'data-dd-previous-display-priority';
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

;// ./src/metadata.ts

function normalizeText(value) {
    return typeof value === 'string' ? value.toLowerCase() : '';
}
function getGenreId(label) {
    const index = WTR_GENRES.findIndex((genre) => genre === label.toLowerCase());
    return index >= 0 ? index + 1 : null;
}
function collectSeriesMetadata(payload) {
    const result = [];
    const visited = new Set();
    collectFromValue(payload, result, visited);
    return result;
}
function collectFromValue(value, result, visited) {
    if (!value || typeof value !== 'object') {
        return;
    }
    if (visited.has(value)) {
        return;
    }
    visited.add(value);
    if (Array.isArray(value)) {
        value.forEach((item) => collectSeriesCandidate(item, result, visited));
        return;
    }
    Object.values(value).forEach((child) => collectFromValue(child, result, visited));
}
function collectSeriesCandidate(value, result, visited) {
    const direct = parseSeriesMetadata(value);
    if (direct) {
        result.push(direct);
        return;
    }
    if (!value || typeof value !== 'object') {
        return;
    }
    const record = value;
    const nested = parseSeriesMetadata(record.serie);
    if (nested) {
        result.push(nested);
        return;
    }
    collectFromValue(value, result, visited);
}
function parseSeriesMetadata(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }
    const record = value;
    const data = isRecord(record.data) ? record.data : undefined;
    const rawId = readNumber(record.raw_id) ?? readNumber(record.rawId) ?? readNumber(record.serie_id);
    const slug = readString(record.slug);
    const title = readString(data?.title);
    const description = readString(data?.description);
    const author = readString(record.author) ?? readString(data?.author);
    const searchText = readString(record.search_text);
    const genreIds = readIds(record.genres);
    const tagIds = readIds(record.tags);
    if (!rawId && !slug) {
        return null;
    }
    if (!title && !searchText && genreIds.length === 0 && tagIds.length === 0) {
        return null;
    }
    return {
        rawId,
        slug,
        title,
        description,
        author,
        searchText,
        genreIds,
        tagIds,
    };
}
function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function readString(value) {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function readNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
function readIds(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.filter((item) => typeof item === 'string' || typeof item === 'number');
}

;// ./src/routes.ts

function isExcludedPage() {
    const path = location.pathname;
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
        this.apiTagsById = new Map();
        this.apiTagsByLabel = new Map();
        this.seriesByRawId = new Map();
        this.seriesBySlug = new Map();
        this.uiHiddenByRoute = false;
        this.savedItems = this.loadSavedItems();
        this.matchMode = this.loadMatchMode();
        this.profiles = this.loadProfiles();
        this.ui.selectMatch.value = this.matchMode;
    }
    async init() {
        this.bindFetchInterceptor();
        this.cacheNextDataScriptMetadata();
        this.renderList();
        this.renderProfiles();
        this.bindEvents();
        this.bindRouteAndMutationHandlers();
        void this.loadCurrentRouteMetadata();
        this.executeDestroyer();
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
    loadProfiles() {
        try {
            const parsed = JSON.parse(getValue(STORAGE_KEYS.profiles, '[]'));
            if (!Array.isArray(parsed)) {
                return [];
            }
            return parsed
                .map((profile) => this.normalizeProfile(profile))
                .filter((profile) => profile !== null);
        }
        catch {
            return [];
        }
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
    isRecord(value) {
        return typeof value === 'object' && value !== null;
    }
    normalizeProfile(profile) {
        if (!this.isRecord(profile)) {
            return null;
        }
        if (typeof profile.id !== 'string' || typeof profile.name !== 'string' || !Array.isArray(profile.items)) {
            return null;
        }
        const now = Date.now();
        const createdAt = typeof profile.createdAt === 'number' ? profile.createdAt : now;
        const updatedAt = typeof profile.updatedAt === 'number' ? profile.updatedAt : createdAt;
        const matchMode = profile.matchMode === 'strict' ? 'strict' : 'broad';
        return {
            id: profile.id,
            name: profile.name,
            items: profile.items.filter((item) => this.isBlockItem(item)),
            matchMode,
            createdAt,
            updatedAt,
        };
    }
    updateStorage() {
        setValue(STORAGE_KEYS.savedItems, JSON.stringify(this.savedItems));
        setValue(STORAGE_KEYS.matchMode, this.matchMode);
    }
    updateProfilesStorage() {
        setValue(STORAGE_KEYS.profiles, JSON.stringify(this.profiles));
    }
    cloneItems(items) {
        return items.map((item) => ({ ...item }));
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
            this.restoreHiddenContainers();
            return;
        }
        const filters = this.createFilterContext();
        const containers = this.getCandidateContainers();
        containers.forEach((container) => {
            if (this.shouldDestroyContainer(container, filters)) {
                this.hideContainer(container);
                return;
            }
            this.restoreContainer(container);
        });
    }
    createFilterContext() {
        const words = this.savedItems.map((item) => item.label.toLowerCase()).filter(Boolean);
        const genreIds = new Set();
        const tagIds = new Set();
        this.savedItems.forEach((item) => {
            if (item.type === 'genre') {
                const genreId = getGenreId(item.label);
                if (genreId !== null) {
                    genreIds.add(String(genreId));
                }
            }
            if (item.type === 'tag') {
                tagIds.add(String(item.id));
            }
        });
        return { words, genreIds, tagIds };
    }
    getCandidateContainers() {
        const containers = new Set();
        const elements = document.querySelectorAll(TARGET_SELECTORS);
        elements.forEach((element) => containers.add(this.getDestroyContainer(element)));
        document.querySelectorAll(`[${HIDDEN_ATTRIBUTE}="true"]`).forEach((element) => containers.add(element));
        return Array.from(containers);
    }
    shouldDestroyContainer(container, filters) {
        const metaTags = this.getMetaTags(container);
        const metadata = this.getSeriesMetadataForContainer(container);
        if (this.hasStrictMatch(metaTags, metadata, filters)) {
            return true;
        }
        if (this.matchMode === 'strict') {
            return false;
        }
        const textToCheck = this.getBroadText(container, metadata);
        return filters.words.some((word) => textToCheck.includes(word) || metaTags.includes(word));
    }
    hasStrictMatch(metaTags, metadata, filters) {
        if (filters.words.some((word) => metaTags.includes(word))) {
            return true;
        }
        if (!metadata) {
            return false;
        }
        return (metadata.genreIds.some((id) => filters.genreIds.has(String(id))) ||
            metadata.tagIds.some((id) => filters.tagIds.has(String(id))));
    }
    getBroadText(container, metadata) {
        return [
            this.getTitleText(container),
            metadata?.title,
            metadata?.description,
            metadata?.author,
            metadata?.searchText,
        ]
            .filter((value) => typeof value === 'string' && value.length > 0)
            .join(' ')
            .toLowerCase();
    }
    getMetaTags(container) {
        return Array.from(container.querySelectorAll('.genre, .tag'))
            .map((tag) => tag.textContent?.toLowerCase().trim() ?? '')
            .filter(Boolean);
    }
    hideContainer(container) {
        if (container.getAttribute(HIDDEN_ATTRIBUTE) !== 'true') {
            container.setAttribute(PREVIOUS_DISPLAY_ATTRIBUTE, container.style.getPropertyValue('display'));
            container.setAttribute(PREVIOUS_DISPLAY_PRIORITY_ATTRIBUTE, container.style.getPropertyPriority('display'));
            container.setAttribute(HIDDEN_ATTRIBUTE, 'true');
        }
        container.style.setProperty('display', 'none', 'important');
    }
    restoreHiddenContainers() {
        document.querySelectorAll(`[${HIDDEN_ATTRIBUTE}="true"]`).forEach((container) => this.restoreContainer(container));
    }
    restoreContainer(container) {
        if (container.getAttribute(HIDDEN_ATTRIBUTE) !== 'true') {
            return;
        }
        const previousDisplay = container.getAttribute(PREVIOUS_DISPLAY_ATTRIBUTE) ?? '';
        const previousPriority = container.getAttribute(PREVIOUS_DISPLAY_PRIORITY_ATTRIBUTE) ?? '';
        if (previousDisplay) {
            container.style.setProperty('display', previousDisplay, previousPriority);
        }
        else {
            container.style.removeProperty('display');
        }
        container.removeAttribute(HIDDEN_ATTRIBUTE);
        container.removeAttribute(PREVIOUS_DISPLAY_ATTRIBUTE);
        container.removeAttribute(PREVIOUS_DISPLAY_PRIORITY_ATTRIBUTE);
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
    getSeriesMetadataForContainer(container) {
        const key = this.getNovelKey(container);
        if (!key) {
            return undefined;
        }
        if (key.rawId !== undefined) {
            const metadata = this.seriesByRawId.get(key.rawId);
            if (metadata) {
                return metadata;
            }
        }
        return key.slug ? this.seriesBySlug.get(key.slug) : undefined;
    }
    getNovelKey(container) {
        const anchors = this.getNovelAnchors(container);
        for (const anchor of anchors) {
            const key = this.parseNovelHref(anchor.getAttribute('href'));
            if (key) {
                return key;
            }
        }
        return null;
    }
    getNovelAnchors(container) {
        const anchors = Array.from(container.querySelectorAll('a[href]'));
        if (container instanceof HTMLAnchorElement && container.hasAttribute('href')) {
            anchors.unshift(container);
        }
        return anchors;
    }
    parseNovelHref(href) {
        if (!href) {
            return null;
        }
        const url = new URL(href, location.href);
        const match = url.pathname.match(/\/novel\/(\d+)\/([^/?#]+)/i);
        if (!match) {
            return null;
        }
        const rawId = Number(match[1]);
        const slug = match[2] ? decodeURIComponent(match[2]) : undefined;
        return Number.isFinite(rawId) ? { rawId, slug } : null;
    }
    bindRouteAndMutationHandlers() {
        const originalPushState = history.pushState.bind(history);
        const originalReplaceState = history.replaceState.bind(history);
        history.pushState = ((data, unused, url) => {
            originalPushState(data, unused, url);
            this.handleRouteChange();
        });
        history.replaceState = ((data, unused, url) => {
            originalReplaceState(data, unused, url);
            this.handleRouteChange();
        });
        addEventListener('popstate', () => this.handleRouteChange());
        const observer = new MutationObserver(() => {
            if (this.destroyTimeoutId !== undefined) {
                clearTimeout(this.destroyTimeoutId);
            }
            this.destroyTimeoutId = setTimeout(() => this.executeDestroyer(), 250);
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    handleRouteChange() {
        setTimeout(() => {
            void this.loadCurrentRouteMetadata();
            this.executeDestroyer();
        }, 100);
    }
    bindFetchInterceptor() {
        const originalFetch = globalThis.fetch.bind(globalThis);
        const interceptedFetch = async (input, init) => {
            const response = await originalFetch(input, init);
            this.inspectFetchResponse(input, response);
            return response;
        };
        globalThis.fetch = interceptedFetch;
    }
    inspectFetchResponse(input, response) {
        const url = this.getRequestUrl(input);
        if (!url || !this.shouldInspectResponse(url, response)) {
            return;
        }
        response.clone().json()
            .then((payload) => {
            this.cachePayloadMetadata(payload);
            this.executeDestroyer();
        })
            .catch(() => {
            console.log('Delulu Destroyer: Skipped non-JSON metadata response.');
        });
    }
    getRequestUrl(input) {
        if (typeof input === 'string') {
            return new URL(input, location.href);
        }
        if (input instanceof URL) {
            return input;
        }
        if (input instanceof Request) {
            return new URL(input.url, location.href);
        }
        return null;
    }
    shouldInspectResponse(url, response) {
        if (!response.ok || url.origin !== location.origin) {
            return false;
        }
        return url.pathname.startsWith('/_next/data/') || url.pathname === '/api/home/recent';
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
                this.clearProfileDraft('Blocklist changed. Select a profile again before overwriting it.');
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
    renderProfiles(selectedProfileId) {
        const previousProfileId = selectedProfileId ?? this.ui.profileSelect.value;
        this.ui.profileSelect.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = this.profiles.length === 0 ? 'No saved profiles' : 'Choose a saved profile';
        this.ui.profileSelect.appendChild(placeholder);
        this.profiles.forEach((profile) => {
            const option = document.createElement('option');
            option.value = profile.id;
            option.textContent = `${profile.name} (${profile.items.length})`;
            this.ui.profileSelect.appendChild(option);
        });
        if (this.profiles.some((profile) => profile.id === previousProfileId)) {
            this.ui.profileSelect.value = previousProfileId;
        }
        const selectedProfile = this.getSelectedProfile();
        if (selectedProfile) {
            this.ui.profileNameInput.value = selectedProfile.name;
        }
        else if (selectedProfileId !== undefined || previousProfileId) {
            this.ui.profileNameInput.value = '';
        }
        this.syncProfileButtons();
    }
    syncProfileButtons() {
        const hasSelectedProfile = this.getSelectedProfile() !== undefined;
        this.ui.profileLoadButton.disabled = !hasSelectedProfile;
        this.ui.profileDeleteButton.disabled = !hasSelectedProfile;
    }
    getSelectedProfile() {
        const selectedId = this.ui.profileSelect.value;
        return selectedId ? this.profiles.find((profile) => profile.id === selectedId) : undefined;
    }
    setStatus(message) {
        this.ui.statusEl.textContent = message;
    }
    openConfirmPrompt(options) {
        if (this.modalResolver) {
            this.resolveConfirmPrompt(false);
        }
        this.ui.modalTitle.textContent = options.title;
        this.ui.modalMessage.textContent = options.message;
        this.ui.modalConfirmButton.textContent = options.confirmLabel;
        this.ui.modalConfirmButton.classList.toggle('dd-btn-danger', options.danger !== false);
        this.ui.modalOverlay.style.display = 'flex';
        return new Promise((resolve) => {
            this.modalResolver = resolve;
        });
    }
    resolveConfirmPrompt(confirmed) {
        this.ui.modalOverlay.style.display = 'none';
        this.ui.modalConfirmButton.classList.add('dd-btn-danger');
        if (!this.modalResolver) {
            return;
        }
        const resolver = this.modalResolver;
        this.modalResolver = undefined;
        resolver(confirmed);
    }
    clearProfileDraft(message) {
        const hadProfileDraft = this.ui.profileSelect.value !== '' || this.ui.profileNameInput.value !== '';
        this.ui.profileSelect.value = '';
        this.ui.profileNameInput.value = '';
        this.syncProfileButtons();
        if (message && hadProfileDraft) {
            this.setStatus(message);
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
        this.savedItems.push(this.createBlockItem(value));
        this.updateStorage();
        this.renderList();
        this.clearProfileDraft('Blocklist changed. Select a profile again before overwriting it.');
        this.ui.inputField.value = '';
        this.ui.autocompleteBox.style.display = 'none';
    }
    copyCurrentBlocklist() {
        const payload = {
            app: SHARE_PAYLOAD_APP,
            version: SHARE_PAYLOAD_VERSION,
            items: this.cloneItems(this.savedItems),
            matchMode: this.matchMode,
        };
        const sharedText = JSON.stringify(payload);
        void this.writeClipboard(sharedText).then((copied) => {
            if (copied) {
                this.setStatus(`Copied ${this.savedItems.length} target(s).`);
                return;
            }
            this.ui.importText.value = sharedText;
            this.ui.importText.focus();
            this.ui.importText.select();
            this.setStatus('Copy failed. Select the generated text and copy it manually.');
        });
    }
    async writeClipboard(text) {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        }
        catch (error) {
            console.log('Delulu Destroyer: Clipboard API copy failed.', error);
        }
        return this.writeClipboardFallback(text);
    }
    writeClipboardFallback(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'fixed';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            return document.execCommand('copy');
        }
        catch (error) {
            console.log('Delulu Destroyer: Fallback copy failed.', error);
            return false;
        }
        finally {
            textarea.remove();
        }
    }
    importSharedBlocklist() {
        const importedItems = this.parseSharedBlocklist(this.ui.importText.value.trim());
        if (importedItems.length === 0) {
            this.setStatus('Paste a valid shared blocklist first.');
            return;
        }
        const previousCount = this.savedItems.length;
        this.savedItems = this.mergeBlockItems(this.savedItems, importedItems);
        this.updateStorage();
        this.renderList();
        this.executeDestroyer();
        this.ui.importText.value = '';
        const addedCount = this.savedItems.length - previousCount;
        if (addedCount > 0) {
            this.clearProfileDraft();
        }
        this.setStatus(addedCount > 0 ? `Imported ${addedCount} new target(s). Select a profile again before overwriting it.` : 'Imported blocklist had no new targets.');
    }
    parseSharedBlocklist(rawValue) {
        if (!rawValue) {
            return [];
        }
        try {
            return this.parseSharedJson(JSON.parse(rawValue));
        }
        catch (error) {
            if (rawValue.startsWith('{') || rawValue.startsWith('[')) {
                console.log('Delulu Destroyer: Shared blocklist JSON could not be parsed.', error);
                return [];
            }
            return this.parsePlainTextBlocklist(rawValue);
        }
    }
    parseSharedJson(payload) {
        if (Array.isArray(payload)) {
            return this.normalizeImportedEntries(payload);
        }
        if (this.isRecord(payload) && Array.isArray(payload.items)) {
            return this.normalizeImportedEntries(payload.items);
        }
        return [];
    }
    parsePlainTextBlocklist(rawValue) {
        return rawValue
            .split(/[\n,]+/)
            .map((value) => value.trim())
            .filter(Boolean)
            .map((value) => this.createBlockItem(value));
    }
    normalizeImportedEntries(entries) {
        return entries
            .map((entry) => this.normalizeImportedEntry(entry))
            .filter((item) => item !== null);
    }
    normalizeImportedEntry(entry) {
        if (typeof entry === 'string') {
            const value = entry.trim();
            return value ? this.createBlockItem(value) : null;
        }
        if (this.isBlockItem(entry)) {
            return this.hydrateSavedItem(entry);
        }
        return null;
    }
    mergeBlockItems(currentItems, nextItems) {
        const merged = [...currentItems, ...nextItems.map((item) => this.hydrateSavedItem(item))];
        const seenLabels = new Set();
        return merged.filter((item) => {
            const signature = item.label.toLowerCase();
            if (seenLabels.has(signature)) {
                return false;
            }
            seenLabels.add(signature);
            return true;
        });
    }
    async saveProfileFromCurrentBlocklist() {
        const profileName = this.ui.profileNameInput.value.trim();
        if (!profileName) {
            this.setStatus('Name the profile before saving.');
            return;
        }
        const selectedProfile = this.getSelectedProfile();
        const matchingProfile = this.profiles.find((profile) => profile.name.toLowerCase() === profileName.toLowerCase());
        const existingProfile = selectedProfile ?? matchingProfile;
        const now = Date.now();
        const nextProfile = {
            id: existingProfile?.id ?? this.createProfileId(),
            name: profileName,
            items: this.cloneItems(this.savedItems),
            matchMode: this.matchMode,
            createdAt: existingProfile?.createdAt ?? now,
            updatedAt: now,
        };
        if (!await this.confirmProfileSave(existingProfile, nextProfile)) {
            this.setStatus('Profile save cancelled.');
            return;
        }
        const existingIndex = this.profiles.findIndex((profile) => profile.id === nextProfile.id);
        if (existingIndex >= 0) {
            this.profiles[existingIndex] = nextProfile;
        }
        else {
            this.profiles.push(nextProfile);
        }
        this.updateProfilesStorage();
        this.renderProfiles(nextProfile.id);
        this.setStatus(`Saved profile "${nextProfile.name}" with ${nextProfile.items.length} target(s).`);
    }
    async confirmProfileSave(existingProfile, nextProfile) {
        if (!existingProfile) {
            if (nextProfile.items.length > 0) {
                return true;
            }
            return this.openConfirmPrompt({
                title: 'Warning',
                message: 'Are you sure you want to save an empty profile? This profile has no blocked targets yet.',
                confirmLabel: 'SAVE EMPTY',
            });
        }
        if (this.hasSameProfileState(existingProfile, nextProfile)) {
            return true;
        }
        const warning = nextProfile.items.length === 0
            ? 'This would replace the saved profile with an empty blocklist.'
            : nextProfile.items.length < existingProfile.items.length
                ? 'The current blocklist has fewer targets than the saved profile.'
                : 'This will replace the saved profile contents.';
        return this.openConfirmPrompt({
            title: 'Warning',
            message: [
                `Saved profile "${existingProfile.name}" has ${existingProfile.items.length} target(s).`,
                `Current blocklist has ${nextProfile.items.length} target(s).`,
                warning,
                'Cancel if you meant to create a new profile instead.',
            ].join('\n'),
            confirmLabel: 'OVERWRITE',
        });
    }
    hasSameProfileState(existingProfile, nextProfile) {
        return (existingProfile.name === nextProfile.name &&
            existingProfile.matchMode === nextProfile.matchMode &&
            this.getBlocklistSignature(existingProfile.items) === this.getBlocklistSignature(nextProfile.items));
    }
    getBlocklistSignature(items) {
        return items
            .map((item) => `${item.type}:${String(item.id)}:${item.label.toLowerCase()}`)
            .sort()
            .join('|');
    }
    async loadSelectedProfile() {
        const profile = this.getSelectedProfile();
        if (!profile) {
            this.setStatus('Choose a profile to load.');
            return;
        }
        if (!await this.confirmProfileLoad(profile)) {
            this.setStatus('Profile load cancelled.');
            return;
        }
        this.savedItems = this.cloneItems(profile.items).map((item) => this.hydrateSavedItem(item));
        this.matchMode = profile.matchMode;
        this.ui.selectMatch.value = this.matchMode;
        this.updateStorage();
        this.renderList();
        this.executeDestroyer();
        this.setStatus(`Loaded profile "${profile.name}".`);
    }
    async confirmProfileLoad(profile) {
        if (this.savedItems.length === 0 || this.getBlocklistSignature(this.savedItems) === this.getBlocklistSignature(profile.items)) {
            return true;
        }
        return this.openConfirmPrompt({
            title: 'Warning',
            message: [
                `Load "${profile.name}" with ${profile.items.length} target(s)?`,
                `This replaces the current blocklist with ${this.savedItems.length} target(s).`,
                'Saved profiles are not deleted.',
            ].join('\n'),
            confirmLabel: 'LOAD',
        });
    }
    async deleteSelectedProfile() {
        const profile = this.getSelectedProfile();
        if (!profile) {
            this.setStatus('Choose a profile to delete.');
            return;
        }
        const confirmed = await this.openConfirmPrompt({
            title: 'Warning',
            message: `Are you sure you want to delete the saved profile "${profile.name}"?\nThis removes the saved profile only. Your current blocklist stays as-is.`,
            confirmLabel: 'DELETE',
        });
        if (!confirmed) {
            this.setStatus('Profile delete cancelled.');
            return;
        }
        this.profiles = this.profiles.filter((savedProfile) => savedProfile.id !== profile.id);
        this.updateProfilesStorage();
        this.renderProfiles();
        this.setStatus(`Deleted profile "${profile.name}".`);
    }
    async confirmPurgeCurrentBlocklist() {
        const confirmed = await this.openConfirmPrompt({
            title: 'Warning',
            message: 'Are you sure you want to annihilate your current blocklist? Saved profiles stay intact.',
            confirmLabel: 'ANNIHILATE',
        });
        if (!confirmed) {
            return;
        }
        this.savedItems = [];
        this.updateStorage();
        this.renderList();
        this.clearProfileDraft('Current blocklist purged. Saved profiles were not changed.');
        this.executeDestroyer();
    }
    createProfileId() {
        return `profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
    createBlockItem(value) {
        const lowerValue = value.toLowerCase();
        if (WTR_GENRES.includes(lowerValue)) {
            return { id: `g_${lowerValue}`, label: lowerValue, type: 'genre' };
        }
        const foundTag = this.apiTagsByLabel.get(lowerValue) ?? this.apiTagsById.get(value);
        if (foundTag) {
            return { id: foundTag.value, label: foundTag.label, type: 'tag' };
        }
        return { id: `c_${Date.now()}`, label: value, type: 'custom' };
    }
    openPanel() {
        this.ui.panel.style.display = 'flex';
        this.ui.launcher.style.display = 'none';
        this.ui.inputField.focus();
    }
    bindEvents() {
        this.ui.launcher.addEventListener('click', () => this.openPanel());
        this.ui.launcher.addEventListener('touchend', (event) => {
            event.preventDefault();
            this.openPanel();
        }, { passive: false });
        this.ui.closeButton.addEventListener('click', () => {
            this.ui.panel.style.display = 'none';
            this.ui.launcher.style.display = 'flex';
            this.ui.autocompleteBox.style.display = 'none';
        });
        this.ui.selectMatch.addEventListener('change', () => {
            this.matchMode = this.ui.selectMatch.value === 'strict' ? 'strict' : 'broad';
            this.updateStorage();
            this.executeDestroyer();
        });
        this.ui.profileSelect.addEventListener('change', () => {
            const selectedProfile = this.getSelectedProfile();
            this.ui.profileNameInput.value = selectedProfile?.name ?? '';
            this.syncProfileButtons();
        });
        this.ui.profileSaveButton.addEventListener('click', () => {
            void this.saveProfileFromCurrentBlocklist();
        });
        this.ui.profileLoadButton.addEventListener('click', () => {
            void this.loadSelectedProfile();
        });
        this.ui.profileDeleteButton.addEventListener('click', () => {
            void this.deleteSelectedProfile();
        });
        this.ui.copyButton.addEventListener('click', () => this.copyCurrentBlocklist());
        this.ui.importButton.addEventListener('click', () => this.importSharedBlocklist());
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
            void this.confirmPurgeCurrentBlocklist();
        });
        this.ui.modalCancelButton.addEventListener('click', () => this.resolveConfirmPrompt(false));
        this.ui.modalConfirmButton.addEventListener('click', () => this.resolveConfirmPrompt(true));
        this.ui.applyButton.addEventListener('click', () => {
            this.addWord();
            this.executeDestroyer();
            this.ui.panel.style.display = 'none';
            this.ui.launcher.style.display = 'flex';
        });
    }
    cacheNextDataScriptMetadata() {
        const nextDataScript = document.getElementById('__NEXT_DATA__');
        if (!nextDataScript?.textContent) {
            return;
        }
        try {
            this.cachePayloadMetadata(JSON.parse(nextDataScript.textContent));
        }
        catch {
            console.log('Delulu Destroyer: Could not read embedded page metadata.');
        }
    }
    async loadApiTags() {
        try {
            const response = await fetch(`https://wtr-lab.com/_next/data/${getNextBuildId()}/${this.getLocale()}/novel-finder.json?locale=${this.getLocale()}`);
            if (!response.ok) {
                return;
            }
            const payload = await response.json();
            this.cachePayloadMetadata(payload);
        }
        catch {
            console.log('Delulu Destroyer: Running without API tag autocompletion.');
        }
    }
    async loadCurrentRouteMetadata() {
        if (isExcludedPage()) {
            return;
        }
        const url = this.getCurrentRouteMetadataUrl();
        if (!url || url.href === this.lastRouteMetadataUrl) {
            return;
        }
        this.lastRouteMetadataUrl = url.href;
        try {
            const response = await fetch(url.href);
            if (!response.ok) {
                return;
            }
            const payload = await response.json();
            this.cachePayloadMetadata(payload);
            this.executeDestroyer();
        }
        catch {
            console.log('Delulu Destroyer: Current page metadata was unavailable.');
        }
    }
    getCurrentRouteMetadataUrl() {
        if (location.pathname.startsWith('/_next/') || location.pathname.includes('/api/')) {
            return null;
        }
        const locale = this.getLocale();
        const cleanPath = location.pathname.replace(/\/$/, '');
        const routePath = cleanPath.length > 0 ? cleanPath : `/${locale}`;
        const url = new URL(`/_next/data/${getNextBuildId()}${routePath}.json`, location.origin);
        const searchParams = new URLSearchParams(location.search);
        if (!searchParams.has('locale')) {
            searchParams.set('locale', locale);
        }
        url.search = searchParams.toString();
        return url;
    }
    getLocale() {
        const segment = location.pathname.split('/').filter(Boolean)[0];
        return segment && /^[a-z]{2}$/i.test(segment) ? segment : 'en';
    }
    cachePayloadMetadata(payload) {
        this.cacheSeriesMetadata(payload);
        const ungrouped = findTags(payload);
        if (ungrouped) {
            this.setApiTags(ungrouped);
        }
    }
    cacheSeriesMetadata(payload) {
        collectSeriesMetadata(payload).forEach((metadata) => this.cacheSeries(metadata));
    }
    cacheSeries(metadata) {
        const existing = metadata.rawId !== undefined
            ? this.seriesByRawId.get(metadata.rawId)
            : metadata.slug ? this.seriesBySlug.get(metadata.slug) : undefined;
        const merged = {
            ...existing,
            ...metadata,
            genreIds: metadata.genreIds.length > 0 ? metadata.genreIds : existing?.genreIds ?? [],
            tagIds: metadata.tagIds.length > 0 ? metadata.tagIds : existing?.tagIds ?? [],
        };
        if (merged.rawId !== undefined) {
            this.seriesByRawId.set(merged.rawId, merged);
        }
        if (merged.slug) {
            this.seriesBySlug.set(merged.slug, merged);
        }
    }
    setApiTags(tags) {
        this.allApiTags = tags.filter(this.isApiTag);
        this.apiTagsById = new Map(this.allApiTags.map((tag) => [String(tag.value), tag]));
        this.apiTagsByLabel = new Map(this.allApiTags.map((tag) => [tag.label.toLowerCase(), tag]));
        if (this.hydrateSavedItemTypes()) {
            this.updateStorage();
            this.renderList();
        }
    }
    isApiTag(tag) {
        return typeof tag.label === 'string' && (typeof tag.value === 'string' || typeof tag.value === 'number');
    }
    hydrateSavedItemTypes() {
        let changed = false;
        const hydrated = this.savedItems.map((item) => {
            const nextItem = this.hydrateSavedItem(item);
            changed || (changed = nextItem !== item);
            return nextItem;
        });
        this.savedItems = this.dedupeItems(hydrated);
        return changed || this.savedItems.length !== hydrated.length;
    }
    hydrateSavedItem(item) {
        const lowerLabel = item.label.toLowerCase();
        if (WTR_GENRES.includes(lowerLabel)) {
            const nextItem = { id: `g_${lowerLabel}`, label: lowerLabel, type: 'genre' };
            return item.id === nextItem.id && item.label === nextItem.label && item.type === nextItem.type ? item : nextItem;
        }
        const tag = this.apiTagsByLabel.get(lowerLabel) ?? this.apiTagsById.get(String(item.id));
        if (tag) {
            const nextItem = { id: tag.value, label: tag.label, type: 'tag' };
            return item.id === nextItem.id && item.label === nextItem.label && item.type === nextItem.type ? item : nextItem;
        }
        return item;
    }
    dedupeItems(items) {
        const seen = new Set();
        return items.filter((item) => {
            const key = `${item.type}:${String(item.id)}:${item.label.toLowerCase()}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
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
            transition: transform 0.2s, box-shadow 0.2s; appearance: none; -webkit-appearance: none;
            touch-action: manipulation;
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

        .dd-tools {
            border: 1px solid var(--dd-border); border-radius: 10px; padding: 8px 10px;
            background: rgba(22, 27, 34, 0.65);
        }
        .dd-tools summary { color: var(--dd-text); cursor: pointer; font-size: 12px; font-weight: bold; }
        .dd-tool-group { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
        .dd-tool-group + .dd-tool-group { border-top: 1px solid var(--dd-border); padding-top: 10px; }
        .dd-action-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .dd-tool-group > .dd-btn { width: 100%; }
        .dd-textarea {
            width: 100%; min-height: 58px; resize: vertical; background: var(--dd-bg);
            border: 1px solid var(--dd-border); color: var(--dd-text); border-radius: 8px;
            padding: 8px 10px; font-size: 12px; outline: none; font-family: inherit;
        }
        .dd-textarea:focus { border-color: var(--dd-accent); }
        .dd-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        #dd-status { min-height: 14px; color: #8b949e; font-size: 11px; line-height: 1.3; }

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
        #dd-modal p { margin: 0 0 24px 0; color: var(--dd-text); font-size: 13px; line-height: 1.4; white-space: pre-line; }
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
    addEventListener('DOMContentLoaded', bootstrap, { once: true });
}

/******/ })()
;