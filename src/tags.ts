import type { ApiTag, WtrFinderPayload } from './types';

export function findTags(payload: unknown): ApiTag[] | null {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const candidate = payload as WtrFinderPayload;
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
