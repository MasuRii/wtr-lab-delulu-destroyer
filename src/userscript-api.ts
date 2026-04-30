type UserscriptRuntime = typeof globalThis & {
    GM_addStyle?: (css: string) => void;
    GM_getValue?: (key: string, defaultValue: string) => string;
    GM_setValue?: (key: string, value: string) => void;
};

const runtime = globalThis as UserscriptRuntime;

export function addStyle(css: string): void {
    if (typeof runtime.GM_addStyle === 'function') {
        runtime.GM_addStyle(css);
        return;
    }

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
}

export function getValue(key: string, defaultValue: string): string {
    if (typeof runtime.GM_getValue === 'function') {
        return runtime.GM_getValue(key, defaultValue);
    }

    return localStorage.getItem(key) ?? defaultValue;
}

export function setValue(key: string, value: string): void {
    if (typeof runtime.GM_setValue === 'function') {
        runtime.GM_setValue(key, value);
        return;
    }

    localStorage.setItem(key, value);
}
