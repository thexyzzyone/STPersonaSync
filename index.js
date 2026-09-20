import { extension_settings } from '../../../extensions.js';
import { extensionName, extensionFolderPath, defaultSettings } from './modules/constants.js';
import { injectToolbarButton, openSyncModal } from './modules/ui.js';

function loadSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    for (const key of Object.keys(defaultSettings)) {
        if (extension_settings[extensionName][key] === undefined) {
            extension_settings[extensionName][key] = defaultSettings[key];
        }
    }
}

jQuery(async () => {
    const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
    $('#extensions_settings').append(settingsHtml);
    loadSettings();

    injectToolbarButton(openSyncModal);
    $(document).on('click', '.stps-open-sync', openSyncModal);
});
