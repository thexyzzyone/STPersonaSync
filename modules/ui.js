import { callGenericPopup, POPUP_TYPE } from '../../../../popup.js';
import { characters, getThumbnailUrl, getCharacters, saveSettingsDebounced } from '../../../../../script.js';
import { extension_settings } from '../../../../extensions.js';
import { extensionName, CREATE_NEW_VALUE } from './constants.js';
import { buildSyncRows, getCharacterDisplayName } from './matching.js';
import { mergeCharacterAttributes, uploadCharacterAvatarFromPersona, createCharacterFromPersona } from './sync-api.js';
import { swapPersonaMacrosForCharacter } from './macros.js';
import { tagCharacterAsSynced } from './tags.js';

export function injectToolbarButton(onClick) {
    if (document.querySelector('.stps-toolbar-btn')) {
        return;
    }

    const button = $('<div class="menu_button menu_button_icon stps-toolbar-btn"></div>')
        .attr('title', 'Sync personas with character cards')
        .append('<i class="fa-solid fa-arrows-rotate"></i>')
        .append('<span>Sync</span>');
    button.on('click', onClick);

    $('.user_stats_button').closest('.flex-container').prepend(button);
}

function buildCharacterSelect(selectedAvatar) {
    const select = $('<select class="stps-target-select"></select>');
    select.append($('<option></option>').val('').text('— none —'));
    select.append($('<option></option>').val(CREATE_NEW_VALUE).text('+ Create new character card'));
    select.append('<hr>');

    const sorted = [...characters].sort((a, b) => getCharacterDisplayName(a).localeCompare(getCharacterDisplayName(b)));
    for (const character of sorted) {
        const label = `${getCharacterDisplayName(character)} (${character.avatar})`;
        select.append($('<option></option>').val(character.avatar).text(label));
    }

    select.val(selectedAvatar || '');
    return select;
}

function buildRow(row) {
    const tr = $('<tr class="stps-row"></tr>')
        .data('persona', row.personaAvatarId)
        .data('persona-name', row.personaName)
        .data('persona-description', row.personaDescription);

    const checkTd = $('<td></td>').append(
        $('<input type="checkbox" class="stps-row-check">').prop('checked', row.checked),
    );

    const personaAvatarTd = $('<td></td>').append(
        $('<img class="stps-avatar">').attr('src', getThumbnailUrl('persona', row.personaAvatarId)),
    );

    const personaNameTd = $('<td class="stps-persona-name"></td>').append(
        $('<div class="stps-persona-name-main"></div>').text(row.personaName),
    );
    if (row.personaTitle) {
        personaNameTd.append($('<div class="stps-persona-name-sub"></div>').text(row.personaTitle));
    }

    const arrowTd = $('<td class="stps-arrow"></td>').append('<i class="fa-solid fa-arrow-right-long"></i>');

    const previewImg = $('<img class="stps-avatar stps-char-avatar">');
    const previewTd = $('<td></td>').append(previewImg);

    function updatePreview(value) {
        if (value && value !== CREATE_NEW_VALUE) {
            previewImg.attr('src', getThumbnailUrl('avatar', value)).css('visibility', 'visible');
        } else {
            previewImg.css('visibility', 'hidden');
        }
    }
    updatePreview(row.matchedAvatar);

    const select = buildCharacterSelect(row.matchedAvatar);
    select.on('change', function () {
        const value = $(this).val();
        tr.find('.stps-row-check').prop('checked', Boolean(value));
        updatePreview(value);
    });
    const targetTd = $('<td></td>').append(select);

    tr.append(checkTd, personaAvatarTd, personaNameTd, arrowTd, previewTd, targetTd);
    return tr;
}

async function syncRow(row) {
    const personaAvatarId = row.data('persona');
    const personaName = row.data('persona-name');
    const personaDescription = swapPersonaMacrosForCharacter(row.data('persona-description') || '');
    const target = row.find('.stps-target-select').val();

    if (!target) {
        return { status: 'skipped' };
    }

    try {
        let characterAvatar = target;
        let created = false;

        if (target === CREATE_NEW_VALUE) {
            characterAvatar = await createCharacterFromPersona(personaName, personaDescription);
            created = true;
        } else {
            await mergeCharacterAttributes(characterAvatar, { name: personaName, description: personaDescription });
        }

        await uploadCharacterAvatarFromPersona(characterAvatar, personaAvatarId);
        tagCharacterAsSynced(characterAvatar);

        extension_settings[extensionName].mappings[personaAvatarId] = characterAvatar;
        saveSettingsDebounced();

        return { status: 'ok', created, characterAvatar };
    } catch (error) {
        console.error(`STPersonaSync: sync failed for persona "${personaName}" (${personaAvatarId})`, error);
        return { status: 'error', error };
    }
}

async function runSync(root) {
    const button = root.find('.stps-sync-btn');
    if (button.hasClass('stps-disabled')) {
        return;
    }

    const rows = root.find('tr.stps-row').filter((_, el) => $(el).find('.stps-row-check').is(':checked'));
    if (!rows.length) {
        toastr.info('No personas selected to sync.');
        return;
    }

    const status = root.find('.stps-status');
    button.addClass('stps-disabled');

    let ok = 0;
    let created = 0;
    let failed = 0;
    const rowElements = rows.toArray();

    for (let i = 0; i < rowElements.length; i++) {
        const row = $(rowElements[i]);
        status.text(`Syncing ${i + 1} of ${rowElements.length}…`);
        const result = await syncRow(row);

        row.removeClass('stps-row-synced stps-row-failed');
        if (result.status === 'ok') {
            ok++;
            if (result.created) created++;
            row.addClass('stps-row-synced');
        } else if (result.status === 'error') {
            failed++;
            row.addClass('stps-row-failed').attr('title', result.error?.message || 'Sync failed');
        }
    }

    button.removeClass('stps-disabled');
    status.text('');
    await getCharacters();

    if (failed) {
        toastr.warning(`Synced ${ok} persona(s), ${failed} failed. Check console for details.`);
    } else {
        const createdNote = created ? ` (${created} new card${created === 1 ? '' : 's'} created)` : '';
        toastr.success(`Synced ${ok} persona(s)${createdNote}.`);
    }
}

function renderModalContent(rows) {
    const container = $('<div class="stps-modal"></div>');
    container.append('<h3>Persona Sync</h3>');
    container.append(
        '<p class="stps-hint">Personas with a detected match are pre-selected. Syncing overwrites the matched '
        + 'character card\'s name, description, and avatar image only — other card data (greetings, alternate '
        + 'greetings, example dialogue, etc.) is left untouched. {{user}}/{{char}} macros in the description are '
        + 'swapped so the card correctly refers to itself as {{char}}. Synced cards are tagged "Synced Persona".</p>',
    );

    const table = $(
        '<table class="stps-table"><thead><tr>'
        + '<th></th><th></th><th>Persona</th><th></th><th></th><th>Character card</th>'
        + '</tr></thead><tbody></tbody></table>',
    );
    const tbody = table.find('tbody');

    if (!rows.length) {
        tbody.append('<tr><td colspan="6" class="stps-empty">No personas found.</td></tr>');
    } else {
        for (const row of rows) {
            tbody.append(buildRow(row));
        }
    }

    container.append($('<div class="stps-table-wrap"></div>').append(table));

    const syncButton = $('<div class="menu_button menu_button_icon stps-sync-btn"></div>')
        .append('<i class="fa-solid fa-arrows-rotate"></i>')
        .append('<span>Sync Selected</span>');
    const status = $('<span class="stps-status"></span>');
    const actions = $('<div class="stps-actions"></div>').append(syncButton, status);
    container.append(actions);

    syncButton.on('click', () => runSync(container));

    return container;
}

export async function openSyncModal() {
    const rows = buildSyncRows();
    const content = renderModalContent(rows);
    await callGenericPopup(content, POPUP_TYPE.DISPLAY, '', {
        wide: true,
        large: true,
        allowVerticalScrolling: true,
    });
}
