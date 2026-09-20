import { getRequestHeaders, getThumbnailUrl } from '../../../../../script.js';
import { getUserAvatar } from '../../../../personas.js';

/**
 * Deep-merges only the given fields into an existing character card, via the
 * server's merge-attributes endpoint. Fields not passed here are left exactly
 * as they are on the card (greetings, alternate greetings, example dialogue, etc.).
 * @param {string} characterAvatar Target character's avatar filename
 * @param {{name?: string, description?: string}} fields Fields to overwrite
 */
export async function mergeCharacterAttributes(characterAvatar, fields) {
    const payload = { avatar: characterAvatar };

    if (fields.name !== undefined) {
        payload.name = fields.name;
        payload.data = { ...(payload.data || {}), name: fields.name };
    }
    if (fields.description !== undefined) {
        payload.description = fields.description;
        payload.data = { ...(payload.data || {}), description: fields.description };
    }

    const response = await fetch('/api/characters/merge-attributes', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server returned ${response.status}`);
    }
}

/**
 * Replaces a character card's avatar image with the given persona's avatar image.
 * @param {string} characterAvatar Target character's avatar filename
 * @param {string} personaAvatarId Source persona's avatar id
 */
export async function uploadCharacterAvatarFromPersona(characterAvatar, personaAvatarId) {
    const sourceResponse = await fetch(getUserAvatar(personaAvatarId), { cache: 'reload' });
    if (!sourceResponse.ok) {
        throw new Error(`Could not read persona avatar image (status ${sourceResponse.status})`);
    }
    const blob = await sourceResponse.blob();

    const formData = new FormData();
    formData.append('avatar', blob, 'avatar.png');
    formData.append('avatar_url', characterAvatar);

    const response = await fetch('/api/characters/edit-avatar', {
        method: 'POST',
        headers: getRequestHeaders({ omitContentType: true }),
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }

    // The server deletes the cached thumbnail on avatar replace; regenerate it now
    // instead of leaving it missing until something else happens to request it.
    const thumbnailUrl = getThumbnailUrl('avatar', characterAvatar);
    await fetch(thumbnailUrl, { method: 'GET', cache: 'reload' });

    const avatarImages = document.querySelectorAll(`img[src^="${thumbnailUrl}"]`);
    for (const img of avatarImages) {
        if (img instanceof HTMLImageElement) {
            const originalSrc = img.src;
            img.src = '';
            img.src = originalSrc;
        }
    }
}

/**
 * Creates a brand-new character card seeded from a persona's name and description.
 * No greeting or other V2-specific content is invented; those stay empty until
 * the user fills them in normally.
 * @param {string} personaName
 * @param {string} personaDescription
 * @returns {Promise<string>} The new character's avatar filename
 */
export async function createCharacterFromPersona(personaName, personaDescription) {
    const characterData = {
        ch_name: personaName,
        description: personaDescription || '',
        first_mes: '',
        personality: '',
        scenario: '',
        mes_example: '',
        creator_notes: '',
        system_prompt: '',
        post_history_instructions: '',
        creator: '',
        character_version: '',
        tags: [],
        talkativeness: '0.5',
        world: '',
        depth_prompt_prompt: '',
        depth_prompt_depth: '4',
        depth_prompt_role: 'system',
        fav: 'false',
        alternate_greetings: [],
        extensions: '{}',
    };

    const response = await fetch('/api/characters/create', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify(characterData),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }

    return (await response.text()).trim();
}
