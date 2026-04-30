export const DESTROYER_STYLES = `
        :root {
            --dd-bg: #0d1117; --dd-pane: #161b22; --dd-text: #c9d1d9;
            --dd-accent: #00ffff; --dd-crimson: #ff0055; 
            --dd-tag: #00ffff; --dd-genre: #ff7b72; --dd-custom: #a371f7;
            --dd-border: #30363d;
        }

        /* Launcher Button */
        #dd-launcher {
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            background: var(--dd-bg); border: 2px solid var(--dd-crimson);
            border-radius: 50px; padding: 8px 16px; display: flex; align-items: center; gap: 8px;
            cursor: pointer; box-shadow: 0 4px 15px rgba(255, 0, 85, 0.3);
            transition: transform 0.2s, box-shadow 0.2s; appearance: none; -webkit-appearance: none;
            touch-action: manipulation;
        }
        #dd-launcher:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 0, 85, 0.5); }
        #dd-launcher span { color: var(--dd-text); font-family: monospace; font-weight: bold; font-size: 13px; }

        /* Floating Panel */
        #dd-panel {
            position: fixed; bottom: 80px; right: 20px; width: 340px; z-index: 10000;
            background: rgba(13, 17, 23, 0.95); backdrop-filter: blur(8px);
            border: 1px solid var(--dd-border); border-radius: 16px;
            display: none; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; overflow: visible;
        }

        /* Header */
        #dd-header {
            background: var(--dd-pane); padding: 12px 16px; border-bottom: 1px solid var(--dd-border);
            border-radius: 16px 16px 0 0; display: flex; justify-content: space-between; align-items: center;
        }
        .dd-title-wrap { display: flex; align-items: center; gap: 8px; }
        .dd-title-wrap h2 { margin: 0; font-size: 14px; color: var(--dd-text); letter-spacing: 1px; font-weight: bold; }
        #dd-close { background: transparent; border: none; color: #8b949e; cursor: pointer; font-size: 16px; transition: color 0.2s; }
        #dd-close:hover { color: var(--dd-crimson); }

        /* Body Area */
        .dd-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; position: relative; }

        .dd-select, .dd-input {
            width: 100%; background: var(--dd-bg); border: 1px solid var(--dd-border);
            color: var(--dd-text); border-radius: 8px; padding: 8px 10px; font-size: 12px; outline: none;
        }
        .dd-select:focus, .dd-input:focus { border-color: var(--dd-accent); }

        .dd-input-wrap { display: flex; gap: 6px; position: relative; }
        .dd-btn {
            background: var(--dd-pane); border: 1px solid var(--dd-border); color: var(--dd-text);
            border-radius: 8px; padding: 8px 12px; cursor: pointer; font-size: 12px; font-weight: bold; transition: 0.2s;
        }
        .dd-btn:hover { border-color: var(--dd-accent); color: var(--dd-accent); }
        .dd-btn.primary { background: var(--dd-accent); color: #000; border: none; }
        .dd-btn.primary:hover { background: #00cccc; }

        /* Autocomplete Dropdown */
        #dd-autocomplete {
            position: absolute; top: calc(100% + 4px); left: 0; width: calc(100% - 40px);
            background: var(--dd-bg); border: 1px solid var(--dd-border); border-radius: 8px;
            max-height: 180px; overflow-y: auto; z-index: 10001; display: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.8);
        }
        #dd-autocomplete::-webkit-scrollbar { width: 4px; }
        #dd-autocomplete::-webkit-scrollbar-thumb { background: var(--dd-border); border-radius: 4px; }
        .dd-ac-item {
            padding: 8px 12px; cursor: pointer; color: var(--dd-text); font-size: 12px;
            border-bottom: 1px solid var(--dd-border); display: flex; justify-content: space-between;
        }
        .dd-ac-item:hover { background: var(--dd-pane); color: var(--dd-accent); }
        .dd-ac-item:last-child { border-bottom: none; }
        .dd-ac-type { font-size: 10px; color: #8b949e; text-transform: uppercase; }

        /* Blocklist Display */
        .dd-list-header { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #8b949e; text-transform: uppercase; font-weight: bold; }
        .dd-purge { color: var(--dd-crimson); cursor: pointer; transition: 0.2s; }
        .dd-purge:hover { text-shadow: 0 0 5px var(--dd-crimson); }

        #dd-blocklist {
            display: flex; flex-wrap: wrap; gap: 6px; max-height: 200px; overflow-y: auto;
            padding-right: 4px; padding-bottom: 4px;
        }
        #dd-blocklist::-webkit-scrollbar { width: 4px; }
        #dd-blocklist::-webkit-scrollbar-thumb { background: var(--dd-border); border-radius: 4px; }

        /* Cute Pills */
        .dd-pill {
            background: var(--dd-bg); border: 1px solid var(--dd-border); border-radius: 20px;
            padding: 4px 10px; display: inline-flex; align-items: center; gap: 6px; font-size: 11px;
            user-select: none; transition: border-color 0.2s;
        }
        .dd-pill:hover { border-color: #8b949e; }
        .dd-pill-icon { font-weight: bold; }
        .dd-pill.type-genre .dd-pill-icon { color: var(--dd-genre); }
        .dd-pill.type-tag .dd-pill-icon { color: var(--dd-tag); }
        .dd-pill.type-custom .dd-pill-icon { color: var(--dd-custom); }
        .dd-remove { background: none; border: none; color: #8b949e; cursor: pointer; font-size: 14px; padding: 0; line-height: 1; }
        .dd-remove:hover { color: var(--dd-crimson); }
        .dd-empty { font-size: 11px; color: #8b949e; font-style: italic; width: 100%; text-align: center; padding: 10px 0; }

        /* Custom Modal */
        #dd-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
            z-index: 20000; display: none; justify-content: center; align-items: center;
        }
        #dd-modal {
            background: var(--dd-pane); border: 1px solid var(--dd-crimson);
            border-radius: 12px; width: 300px; padding: 24px; text-align: center;
            box-shadow: 0 0 30px rgba(255, 0, 85, 0.2); font-family: 'Segoe UI', Tahoma, sans-serif;
        }
        #dd-modal h3 { margin: 0 0 10px 0; color: var(--dd-crimson); font-size: 16px; font-weight: bold; text-transform: uppercase; }
        #dd-modal p { margin: 0 0 24px 0; color: var(--dd-text); font-size: 13px; line-height: 1.4; }
        .dd-modal-btns { display: flex; gap: 12px; justify-content: center; }
        .dd-btn-danger { background: var(--dd-crimson); color: #fff; border: none; }
        .dd-btn-danger:hover { background: #ff1a66; box-shadow: 0 0 10px rgba(255, 0, 85, 0.5); }
`;
