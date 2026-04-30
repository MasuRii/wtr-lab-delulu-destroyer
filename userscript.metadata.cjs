const USERSCRIPT_METADATA = `// ==UserScript==
// @name         WTR Lab Delulu Destroyer
// @namespace    https://docs.scriptcat.org/en/
// @version      4.8
// @description  A lightweight, floating, ultra-fast novel purger for WTR Lab.
// @author       MasuRii
// @match        https://wtr-lab.com/*
// @exclude      *://wtr-lab.com/*/novel/*/chapter-*
// @exclude      *://wtr-lab.com/*/library*
// @exclude      *://wtr-lab.com/*/news*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wtr-lab.com
// @license      MIT
// @compatible   scriptcat
// @compatible   violentmonkey
// @compatible   stay
// @compatible   tampermonkey
// @run-at       document-end
// @noframes
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==`;

module.exports = { USERSCRIPT_METADATA };
