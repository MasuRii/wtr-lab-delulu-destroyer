import {
    DEFAULT_MATCH_MODE,
    HIDDEN_ATTRIBUTE,
    PREVIOUS_DISPLAY_ATTRIBUTE,
    PREVIOUS_DISPLAY_PRIORITY_ATTRIBUTE,
    STORAGE_KEYS,
    TARGET_SELECTORS,
    WTR_GENRES,
} from './constants';
import { collectSeriesMetadata, getGenreId } from './metadata';
import { getNextBuildId, isExcludedPage } from './routes';
import { findTags } from './tags';
import type { ApiTag, BlockItem, BlockItemType, MatchMode, SeriesMetadata } from './types';
import type { DestroyerUi } from './ui';
import { getValue, setValue } from './userscript-api';

interface Suggestion extends BlockItem {
    type: BlockItemType;
}

interface FilterContext {
    words: string[];
    genreIds: Set<string>;
    tagIds: Set<string>;
}

interface NovelKey {
    rawId?: number;
    slug?: string;
}

export class DeluluDestroyerApp {
    private savedItems: BlockItem[];
    private matchMode: MatchMode;
    private allApiTags: ApiTag[] = [];
    private apiTagsById = new Map<string, ApiTag>();
    private apiTagsByLabel = new Map<string, ApiTag>();
    private seriesByRawId = new Map<number, SeriesMetadata>();
    private seriesBySlug = new Map<string, SeriesMetadata>();
    private uiHiddenByRoute = false;
    private destroyTimeoutId: ReturnType<typeof setTimeout> | undefined;
    private lastRouteMetadataUrl: string | undefined;

    public constructor(private readonly ui: DestroyerUi) {
        this.savedItems = this.loadSavedItems();
        this.matchMode = this.loadMatchMode();
        this.ui.selectMatch.value = this.matchMode;
    }

    public async init(): Promise<void> {
        this.bindFetchInterceptor();
        this.cacheNextDataScriptMetadata();
        this.renderList();
        this.bindEvents();
        this.bindRouteAndMutationHandlers();
        void this.loadCurrentRouteMetadata();
        this.executeDestroyer();
        await this.loadApiTags();
        this.executeDestroyer();
    }

    private loadSavedItems(): BlockItem[] {
        try {
            const parsed = JSON.parse(getValue(STORAGE_KEYS.savedItems, '[]')) as unknown;
            return Array.isArray(parsed) ? parsed.filter(this.isBlockItem) : [];
        } catch {
            return [];
        }
    }

    private loadMatchMode(): MatchMode {
        const value = getValue(STORAGE_KEYS.matchMode, DEFAULT_MATCH_MODE);
        return value === 'strict' ? 'strict' : 'broad';
    }

    private isBlockItem(item: unknown): item is BlockItem {
        if (!item || typeof item !== 'object') {
            return false;
        }

        const candidate = item as Partial<BlockItem>;
        return (
            (typeof candidate.id === 'string' || typeof candidate.id === 'number') &&
            typeof candidate.label === 'string' &&
            (candidate.type === 'genre' || candidate.type === 'tag' || candidate.type === 'custom')
        );
    }

    private updateStorage(): void {
        setValue(STORAGE_KEYS.savedItems, JSON.stringify(this.savedItems));
        setValue(STORAGE_KEYS.matchMode, this.matchMode);
    }

    private executeDestroyer(): void {
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

    private createFilterContext(): FilterContext {
        const words = this.savedItems.map((item) => item.label.toLowerCase()).filter(Boolean);
        const genreIds = new Set<string>();
        const tagIds = new Set<string>();

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

    private getCandidateContainers(): HTMLElement[] {
        const containers = new Set<HTMLElement>();
        const elements = document.querySelectorAll<HTMLElement>(TARGET_SELECTORS);

        elements.forEach((element) => containers.add(this.getDestroyContainer(element)));
        document.querySelectorAll<HTMLElement>(`[${HIDDEN_ATTRIBUTE}="true"]`).forEach((element) => containers.add(element));

        return Array.from(containers);
    }

    private shouldDestroyContainer(container: HTMLElement, filters: FilterContext): boolean {
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

    private hasStrictMatch(metaTags: string[], metadata: SeriesMetadata | undefined, filters: FilterContext): boolean {
        if (filters.words.some((word) => metaTags.includes(word))) {
            return true;
        }

        if (!metadata) {
            return false;
        }

        return (
            metadata.genreIds.some((id) => filters.genreIds.has(String(id))) ||
            metadata.tagIds.some((id) => filters.tagIds.has(String(id)))
        );
    }

    private getBroadText(container: HTMLElement, metadata: SeriesMetadata | undefined): string {
        return [
            this.getTitleText(container),
            metadata?.title,
            metadata?.description,
            metadata?.author,
            metadata?.searchText,
        ]
            .filter((value): value is string => typeof value === 'string' && value.length > 0)
            .join(' ')
            .toLowerCase();
    }

    private getMetaTags(container: HTMLElement): string[] {
        return Array.from(container.querySelectorAll('.genre, .tag'))
            .map((tag) => tag.textContent?.toLowerCase().trim() ?? '')
            .filter(Boolean);
    }

    private hideContainer(container: HTMLElement): void {
        if (container.getAttribute(HIDDEN_ATTRIBUTE) !== 'true') {
            container.setAttribute(PREVIOUS_DISPLAY_ATTRIBUTE, container.style.getPropertyValue('display'));
            container.setAttribute(PREVIOUS_DISPLAY_PRIORITY_ATTRIBUTE, container.style.getPropertyPriority('display'));
            container.setAttribute(HIDDEN_ATTRIBUTE, 'true');
        }

        container.style.setProperty('display', 'none', 'important');
    }

    private restoreHiddenContainers(): void {
        document.querySelectorAll<HTMLElement>(`[${HIDDEN_ATTRIBUTE}="true"]`).forEach((container) => this.restoreContainer(container));
    }

    private restoreContainer(container: HTMLElement): void {
        if (container.getAttribute(HIDDEN_ATTRIBUTE) !== 'true') {
            return;
        }

        const previousDisplay = container.getAttribute(PREVIOUS_DISPLAY_ATTRIBUTE) ?? '';
        const previousPriority = container.getAttribute(PREVIOUS_DISPLAY_PRIORITY_ATTRIBUTE) ?? '';

        if (previousDisplay) {
            container.style.setProperty('display', previousDisplay, previousPriority);
        } else {
            container.style.removeProperty('display');
        }

        container.removeAttribute(HIDDEN_ATTRIBUTE);
        container.removeAttribute(PREVIOUS_DISPLAY_ATTRIBUTE);
        container.removeAttribute(PREVIOUS_DISPLAY_PRIORITY_ATTRIBUTE);
    }

    private getDestroyContainer(element: HTMLElement): HTMLElement {
        const cardWrapper = element.closest<HTMLElement>('.card');

        if (!cardWrapper) {
            return element;
        }

        const itemsInCard = cardWrapper.querySelectorAll('.serie-item, .list-item, .rank-item, .rec-item, .recent-item');
        return itemsInCard.length === 1 ? cardWrapper : element;
    }

    private getTitleText(container: HTMLElement): string {
        const titleNode = container.querySelector<HTMLElement>('.title, [title], .rawtitle');

        if (titleNode) {
            return (titleNode.getAttribute('title') ?? titleNode.textContent ?? '').toLowerCase();
        }

        return (container.getAttribute('title') ?? '').toLowerCase();
    }

    private getSeriesMetadataForContainer(container: HTMLElement): SeriesMetadata | undefined {
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

    private getNovelKey(container: HTMLElement): NovelKey | null {
        const anchors = this.getNovelAnchors(container);

        for (const anchor of anchors) {
            const key = this.parseNovelHref(anchor.getAttribute('href'));

            if (key) {
                return key;
            }
        }

        return null;
    }

    private getNovelAnchors(container: HTMLElement): HTMLAnchorElement[] {
        const anchors = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href]'));

        if (container instanceof HTMLAnchorElement && container.hasAttribute('href')) {
            anchors.unshift(container);
        }

        return anchors;
    }

    private parseNovelHref(href: string | null): NovelKey | null {
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

    private bindRouteAndMutationHandlers(): void {
        const originalPushState = history.pushState.bind(history);
        const originalReplaceState = history.replaceState.bind(history);

        history.pushState = ((data: unknown, unused: string, url?: string | URL | null): void => {
            originalPushState(data, unused, url);
            this.handleRouteChange();
        }) as History['pushState'];

        history.replaceState = ((data: unknown, unused: string, url?: string | URL | null): void => {
            originalReplaceState(data, unused, url);
            this.handleRouteChange();
        }) as History['replaceState'];

        addEventListener('popstate', () => this.handleRouteChange());

        const observer = new MutationObserver(() => {
            if (this.destroyTimeoutId !== undefined) {
                clearTimeout(this.destroyTimeoutId);
            }

            this.destroyTimeoutId = setTimeout(() => this.executeDestroyer(), 250);
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    private handleRouteChange(): void {
        setTimeout(() => {
            void this.loadCurrentRouteMetadata();
            this.executeDestroyer();
        }, 100);
    }

    private bindFetchInterceptor(): void {
        const originalFetch = globalThis.fetch.bind(globalThis);
        const interceptedFetch: typeof fetch = async (input, init) => {
            const response = await originalFetch(input, init);
            this.inspectFetchResponse(input, response);
            return response;
        };

        globalThis.fetch = interceptedFetch;
    }

    private inspectFetchResponse(input: RequestInfo | URL, response: Response): void {
        const url = this.getRequestUrl(input);

        if (!url || !this.shouldInspectResponse(url, response)) {
            return;
        }

        response.clone().json()
            .then((payload: unknown) => {
                this.cachePayloadMetadata(payload);
                this.executeDestroyer();
            })
            .catch(() => {
                console.log('Delulu Destroyer: Skipped non-JSON metadata response.');
            });
    }

    private getRequestUrl(input: RequestInfo | URL): URL | null {
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

    private shouldInspectResponse(url: URL, response: Response): boolean {
        if (!response.ok || url.origin !== location.origin) {
            return false;
        }

        return url.pathname.startsWith('/_next/data/') || url.pathname === '/api/home/recent';
    }

    private renderList(): void {
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

    private getPillIcon(type: BlockItemType): string {
        if (type === 'genre') {
            return 'G';
        }

        if (type === 'tag') {
            return '#';
        }

        return '*';
    }

    private getSuggestions(query: string): Suggestion[] {
        if (!query) {
            return [];
        }

        const lowerQuery = query.toLowerCase();
        const savedLabels = this.savedItems.map((item) => item.label.toLowerCase());

        const genreMatches = WTR_GENRES
            .filter((genre) => genre.toLowerCase().includes(lowerQuery) && !savedLabels.includes(genre.toLowerCase()))
            .map((genre): Suggestion => ({ label: genre, type: 'genre', id: `g_${genre.toLowerCase()}` }));

        const tagMatches = this.allApiTags
            .filter((tag) => tag.label.toLowerCase().includes(lowerQuery) && !savedLabels.includes(tag.label.toLowerCase()))
            .map((tag): Suggestion => ({ label: tag.label, type: 'tag', id: tag.value }));

        return [...genreMatches, ...tagMatches].slice(0, 15);
    }

    private renderAutocomplete(): void {
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

    private addWord(): void {
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
        this.ui.inputField.value = '';
        this.ui.autocompleteBox.style.display = 'none';
    }

    private createBlockItem(value: string): BlockItem {
        const lowerValue = value.toLowerCase();

        if (WTR_GENRES.includes(lowerValue as (typeof WTR_GENRES)[number])) {
            return { id: `g_${lowerValue}`, label: lowerValue, type: 'genre' };
        }

        const foundTag = this.apiTagsByLabel.get(lowerValue) ?? this.apiTagsById.get(value);

        if (foundTag) {
            return { id: foundTag.value, label: foundTag.label, type: 'tag' };
        }

        return { id: `c_${Date.now()}`, label: value, type: 'custom' };
    }

    private openPanel(): void {
        this.ui.panel.style.display = 'flex';
        this.ui.launcher.style.display = 'none';
        this.ui.inputField.focus();
    }

    private bindEvents(): void {
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

    private cacheNextDataScriptMetadata(): void {
        const nextDataScript = document.getElementById('__NEXT_DATA__');

        if (!nextDataScript?.textContent) {
            return;
        }

        try {
            this.cachePayloadMetadata(JSON.parse(nextDataScript.textContent) as unknown);
        } catch {
            console.log('Delulu Destroyer: Could not read embedded page metadata.');
        }
    }

    private async loadApiTags(): Promise<void> {
        try {
            const response = await fetch(`https://wtr-lab.com/_next/data/${getNextBuildId()}/${this.getLocale()}/novel-finder.json?locale=${this.getLocale()}`);

            if (!response.ok) {
                return;
            }

            const payload = await response.json() as unknown;
            this.cachePayloadMetadata(payload);
        } catch {
            console.log('Delulu Destroyer: Running without API tag autocompletion.');
        }
    }

    private async loadCurrentRouteMetadata(): Promise<void> {
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

            const payload = await response.json() as unknown;
            this.cachePayloadMetadata(payload);
            this.executeDestroyer();
        } catch {
            console.log('Delulu Destroyer: Current page metadata was unavailable.');
        }
    }

    private getCurrentRouteMetadataUrl(): URL | null {
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

    private getLocale(): string {
        const segment = location.pathname.split('/').filter(Boolean)[0];
        return segment && /^[a-z]{2}$/i.test(segment) ? segment : 'en';
    }

    private cachePayloadMetadata(payload: unknown): void {
        this.cacheSeriesMetadata(payload);

        const ungrouped = findTags(payload);

        if (ungrouped) {
            this.setApiTags(ungrouped);
        }
    }

    private cacheSeriesMetadata(payload: unknown): void {
        collectSeriesMetadata(payload).forEach((metadata) => this.cacheSeries(metadata));
    }

    private cacheSeries(metadata: SeriesMetadata): void {
        const existing = metadata.rawId !== undefined
            ? this.seriesByRawId.get(metadata.rawId)
            : metadata.slug ? this.seriesBySlug.get(metadata.slug) : undefined;
        const merged: SeriesMetadata = {
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

    private setApiTags(tags: ApiTag[]): void {
        this.allApiTags = tags.filter(this.isApiTag);
        this.apiTagsById = new Map(this.allApiTags.map((tag) => [String(tag.value), tag]));
        this.apiTagsByLabel = new Map(this.allApiTags.map((tag) => [tag.label.toLowerCase(), tag]));

        if (this.hydrateSavedItemTypes()) {
            this.updateStorage();
            this.renderList();
        }
    }

    private isApiTag(tag: ApiTag): boolean {
        return typeof tag.label === 'string' && (typeof tag.value === 'string' || typeof tag.value === 'number');
    }

    private hydrateSavedItemTypes(): boolean {
        let changed = false;
        const hydrated = this.savedItems.map((item) => {
            const nextItem = this.hydrateSavedItem(item);
            changed ||= nextItem !== item;
            return nextItem;
        });

        this.savedItems = this.dedupeItems(hydrated);
        return changed || this.savedItems.length !== hydrated.length;
    }

    private hydrateSavedItem(item: BlockItem): BlockItem {
        const lowerLabel = item.label.toLowerCase();

        if (WTR_GENRES.includes(lowerLabel as (typeof WTR_GENRES)[number])) {
            const nextItem = { id: `g_${lowerLabel}`, label: lowerLabel, type: 'genre' as const };
            return item.id === nextItem.id && item.label === nextItem.label && item.type === nextItem.type ? item : nextItem;
        }

        const tag = this.apiTagsByLabel.get(lowerLabel) ?? this.apiTagsById.get(String(item.id));

        if (tag) {
            const nextItem = { id: tag.value, label: tag.label, type: 'tag' as const };
            return item.id === nextItem.id && item.label === nextItem.label && item.type === nextItem.type ? item : nextItem;
        }

        return item;
    }

    private dedupeItems(items: BlockItem[]): BlockItem[] {
        const seen = new Set<string>();

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
