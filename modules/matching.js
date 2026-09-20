import { power_user } from '../../../../power-user.js';
import { characters } from '../../../../../script.js';
import { extension_settings } from '../../../../extensions.js';
import { extensionName } from './constants.js';

export function getCharacterDisplayName(character) {
    return character?.data?.name || character?.name || '';
}

function getConnectedCharacterAvatar(personaAvatarId) {
    const connections = power_user.persona_descriptions?.[personaAvatarId]?.connections || [];
    return connections.find(connection => connection.type === 'character')?.id;
}

/**
 * Builds one row per known persona, with its best-guess character-card match.
 * Match priority: our own saved mapping, then SillyTavern's persona<->character
 * lock ("connections"), then an unambiguous character name match. Personas whose
 * name collides across multiple characters are left unmatched rather than guessed.
 * @returns {Array<{personaAvatarId: string, personaName: string, personaTitle: string, personaDescription: string, matchedAvatar: string|null, matchSource: string, checked: boolean}>}
 */
export function buildSyncRows() {
    const mappings = extension_settings[extensionName].mappings;
    const claimed = new Set();
    const rows = [];

    for (const personaAvatarId of Object.keys(power_user.personas || {})) {
        const personaName = power_user.personas[personaAvatarId];
        const descriptor = power_user.persona_descriptions?.[personaAvatarId];
        let matchedAvatar = null;
        let matchSource = 'none';

        const saved = mappings[personaAvatarId];
        if (saved && characters.some(c => c.avatar === saved)) {
            matchedAvatar = saved;
            matchSource = 'saved';
        }

        if (!matchedAvatar) {
            const connected = getConnectedCharacterAvatar(personaAvatarId);
            if (connected && characters.some(c => c.avatar === connected)) {
                matchedAvatar = connected;
                matchSource = 'connection';
            }
        }

        if (!matchedAvatar) {
            const nameMatches = characters.filter(c => getCharacterDisplayName(c) === personaName && !claimed.has(c.avatar));
            if (nameMatches.length === 1) {
                matchedAvatar = nameMatches[0].avatar;
                matchSource = 'name';
            }
        }

        if (matchedAvatar) {
            claimed.add(matchedAvatar);
        }

        rows.push({
            personaAvatarId,
            personaName,
            personaTitle: descriptor?.title || '',
            personaDescription: descriptor?.description || '',
            matchedAvatar,
            matchSource,
            checked: Boolean(matchedAvatar),
        });
    }

    return rows;
}
