import { DeluluDestroyerApp } from './app';
import { DESTROYER_STYLES } from './styles';
import { createDestroyerUi } from './ui';
import { addStyle } from './userscript-api';

function bootstrap(): void {
    addStyle(DESTROYER_STYLES);

    const ui = createDestroyerUi();
    const app = new DeluluDestroyerApp(ui);
    void app.init();
}

if (document.body) {
    bootstrap();
} else {
    addEventListener('DOMContentLoaded', bootstrap, { once: true });
}
