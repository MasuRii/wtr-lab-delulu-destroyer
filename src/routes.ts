import { NEXT_BUILD_ID_FALLBACK } from './constants';

interface NextData {
    buildId?: string;
}

export function isExcludedPage(): boolean {
    const path = window.location.pathname;

    if (/\/novel\/.*\/chapter-/i.test(path)) {
        return true;
    }

    if (path.includes('/library') || path.includes('/news')) {
        return true;
    }

    return path.includes('/profile/') && !path.includes('/profile/vote-serie');
}

export function getNextBuildId(): string {
    const nextDataScript = document.getElementById('__NEXT_DATA__');

    if (!nextDataScript?.textContent) {
        return NEXT_BUILD_ID_FALLBACK;
    }

    try {
        const nextData = JSON.parse(nextDataScript.textContent) as NextData;
        return nextData.buildId ?? NEXT_BUILD_ID_FALLBACK;
    } catch {
        return NEXT_BUILD_ID_FALLBACK;
    }
}
