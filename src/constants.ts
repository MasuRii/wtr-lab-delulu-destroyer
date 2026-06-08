export const SCRIPT_VERSION = '5.2.1';

export const STORAGE_KEYS = {
    savedItems: 'wtr_saved_items',
    matchMode: 'wtr_match_mode',
    profiles: 'wtr_profiles',
    launcherHidden: 'wtr_launcher_hidden',
    widgetPosition: 'wtr_widget_position',
} as const;

export const DEFAULT_MATCH_MODE = 'broad';

export const SHARE_PAYLOAD_APP = 'wtr-delulu-destroyer';

export const SHARE_PAYLOAD_VERSION = 1;

export const NEXT_BUILD_ID_FALLBACK = 'AFYVrA8IT1yIw6NoO3KBr';

export const TARGET_SELECTORS = '.recent-item, .nv-list-item, .serie-rankings [data-slot="card"], .series-list [data-slot="card"], .image-wrap.zoom';

export const HIDDEN_ATTRIBUTE = 'data-dd-hidden';
export const PREVIOUS_DISPLAY_ATTRIBUTE = 'data-dd-previous-display';
export const PREVIOUS_DISPLAY_PRIORITY_ATTRIBUTE = 'data-dd-previous-display-priority';

export const DEFAULT_ANCHOR_RIGHT = 20;
export const DEFAULT_ANCHOR_BOTTOM = 20;
export const PANEL_ANCHOR_OFFSET = 60;
export const ANCHOR_VIEWPORT_PADDING = 4;
export const DRAG_THRESHOLD_PX = 5;

export const WTR_GENRES = [
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
] as const;
