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
