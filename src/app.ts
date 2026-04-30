import { DEFAULT_MATCH_MODE, STORAGE_KEYS, TARGET_SELECTORS, WTR_GENRES } from './constants';
import { getNextBuildId, isExcludedPage } from './routes';
import { findTags } from './tags';
import type { ApiTag, BlockItem, BlockItemType, MatchMode } from './types';
import type { DestroyerUi } from './ui';
import { getValue, setValue } from './userscript-api';

interface Suggestion extends BlockItem {
    type: BlockItemType;
}

export class DeluluDestroyerApp {
    private savedItems: BlockItem[];
    private matchMode: MatchMode;
    private allApiTags: ApiTag[] = [];
    private uiHiddenByRoute = false;
    private destroyTimeoutId: ReturnType<typeof setTimeout> | undefined;

    public constructor(private readonly ui: DestroyerUi) {
        this.savedItems = this.loadSavedItems();
        this.matchMode = this.loadMatchMode();
        this.ui.selectMatch.value = this.matchMode;
    }

    public async init(): Promise<void> {
        this.renderList();
        this.bindEvents();
        this.bindRouteAndMutationHandlers();
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
            return;
        }

        const blockWords = this.savedItems.map((item) => item.label.toLowerCase());
        const elements = document.querySelectorAll<HTMLElement>(TARGET_SELECTORS);

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

    private bindRouteAndMutationHandlers(): void {
        const originalPushState = history.pushState.bind(history);
        const originalReplaceState = history.replaceState.bind(history);

        history.pushState = ((data: unknown, unused: string, url?: string | URL | null): void => {
            originalPushState(data, unused, url);
            setTimeout(() => this.executeDestroyer(), 100);
        }) as History['pushState'];

        history.replaceState = ((data: unknown, unused: string, url?: string | URL | null): void => {
            originalReplaceState(data, unused, url);
            setTimeout(() => this.executeDestroyer(), 100);
        }) as History['replaceState'];

        addEventListener('popstate', () => setTimeout(() => this.executeDestroyer(), 100));

        const observer = new MutationObserver(() => {
            if (this.destroyTimeoutId !== undefined) {
                clearTimeout(this.destroyTimeoutId);
            }

            this.destroyTimeoutId = setTimeout(() => this.executeDestroyer(), 250);
        });

        observer.observe(document.body, { childList: true, subtree: true });
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

        let type: BlockItemType = 'custom';
        let label = value;
        let id: string | number = `c_${Date.now()}`;

        if (WTR_GENRES.includes(value.toLowerCase() as (typeof WTR_GENRES)[number])) {
            type = 'genre';
            id = `g_${value.toLowerCase()}`;
        } else {
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

    private async loadApiTags(): Promise<void> {
        try {
            const response = await fetch(`https://wtr-lab.com/_next/data/${getNextBuildId()}/en/novel-finder.json?locale=en`);

            if (!response.ok) {
                return;
            }

            const payload = await response.json() as unknown;
            const ungrouped = findTags(payload);

            if (ungrouped) {
                this.allApiTags = ungrouped;
            }
        } catch {
            console.log('Delulu Destroyer: Running without API tag autocompletion.');
        }
    }
}
