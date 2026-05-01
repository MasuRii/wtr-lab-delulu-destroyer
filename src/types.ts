export type MatchMode = 'broad' | 'strict';

export type BlockItemType = 'genre' | 'tag' | 'custom';

export interface BlockItem {
    id: string | number;
    label: string;
    type: BlockItemType;
}

export interface ApiTag {
    label: string;
    value: string | number;
    category_id?: string | number;
}

export interface BlocklistProfile {
    id: string;
    name: string;
    items: BlockItem[];
    matchMode: MatchMode;
    createdAt: number;
    updatedAt: number;
}

export interface BlocklistSharePayload {
    app: string;
    version: number;
    items: BlockItem[];
    matchMode?: MatchMode;
}

export interface SeriesMetadata {
    rawId?: number;
    slug?: string;
    title?: string;
    description?: string;
    author?: string;
    searchText?: string;
    genreIds: Array<string | number>;
    tagIds: Array<string | number>;
}

export interface WtrFinderPayload {
    tags?: {
        ungrouped?: ApiTag[];
    };
    [key: string]: unknown;
}
