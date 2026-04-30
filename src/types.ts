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
}

export interface WtrFinderPayload {
    tags?: {
        ungrouped?: ApiTag[];
    };
    [key: string]: unknown;
}
