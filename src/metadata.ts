import { WTR_GENRES } from './constants';
import type { SeriesMetadata } from './types';

interface UnknownRecord {
    [key: string]: unknown;
}

export function normalizeText(value: unknown): string {
    return typeof value === 'string' ? value.toLowerCase() : '';
}

export function getGenreId(label: string): number | null {
    const index = WTR_GENRES.findIndex((genre) => genre === label.toLowerCase());
    return index >= 0 ? index + 1 : null;
}

export function collectSeriesMetadata(payload: unknown): SeriesMetadata[] {
    const result: SeriesMetadata[] = [];
    const visited = new Set<object>();

    collectFromValue(payload, result, visited);

    return result;
}

function collectFromValue(value: unknown, result: SeriesMetadata[], visited: Set<object>): void {
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

    Object.values(value as UnknownRecord).forEach((child) => collectFromValue(child, result, visited));
}

function collectSeriesCandidate(value: unknown, result: SeriesMetadata[], visited: Set<object>): void {
    const direct = parseSeriesMetadata(value);

    if (direct) {
        result.push(direct);
        return;
    }

    if (!value || typeof value !== 'object') {
        return;
    }

    const record = value as UnknownRecord;
    const nested = parseSeriesMetadata(record.serie);

    if (nested) {
        result.push(nested);
        return;
    }

    collectFromValue(value, result, visited);
}

function parseSeriesMetadata(value: unknown): SeriesMetadata | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }

    const record = value as UnknownRecord;
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

function isRecord(value: unknown): value is UnknownRecord {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readIds(value: unknown): Array<string | number> {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string | number => typeof item === 'string' || typeof item === 'number');
}
