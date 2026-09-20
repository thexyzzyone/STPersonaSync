import { tags, addTagsToEntity, TAG_FOLDER_DEFAULT_TYPE } from '../../../../tags.js';
import { DEFAULT_FILTER_STATE } from '../../../../filters.js';
import { uuidv4 } from '../../../../utils.js';

const SYNCED_TAG_NAME = 'Synced Persona';

function findOrCreateSyncedTag() {
    let tag = tags.find(t => t.name.toLowerCase() === SYNCED_TAG_NAME.toLowerCase());
    if (!tag) {
        tag = {
            id: uuidv4(),
            name: SYNCED_TAG_NAME,
            folder_type: TAG_FOLDER_DEFAULT_TYPE,
            filter_state: DEFAULT_FILTER_STATE,
            sort_order: Math.max(0, ...tags.map(t => t.sort_order ?? 0)) + 1,
            is_hidden_on_character_card: false,
            color: '',
            color2: '',
            create_date: Date.now(),
        };
        tags.push(tag);
    }
    return tag;
}

/**
 * Tags a character card with "Synced Persona" so synced cards are easy to find/filter.
 * @param {string} characterAvatar Target character's avatar filename
 */
export function tagCharacterAsSynced(characterAvatar) {
    const tag = findOrCreateSyncedTag();
    addTagsToEntity(tag, characterAvatar);
}
