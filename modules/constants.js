export const extensionName = 'STPersonaSync';
export const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

export const defaultSettings = {
    // personaAvatarId -> characterAvatar filename, populated after a successful sync
    mappings: {},
};

// Sentinel select value meaning "create a brand-new character card from this persona"
export const CREATE_NEW_VALUE = '__stps_create_new__';
