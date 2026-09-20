# Persona Sync

Syncs a Persona with its own character card (for use in group chats) and back again, without losing data such as Greetings (on V2 cards) or Pronouns (on Personas) in either direction.

## Status

Functional. Adds a Sync icon to the Persona Management toolbar.

## How it works

Clicking the sync icon opens a list of every persona alongside its best-guess
character card match:

1. A previously saved sync mapping, if one exists.
2. Otherwise, SillyTavern's own persona↔character connection (lock), if the
   persona is locked to a character.
3. Otherwise, an exact name match — but only if it's unambiguous. Personas
   that share a name with more than one character (or vice versa) are left
   unmatched rather than guessed, since picking wrong would silently
   overwrite the wrong card.

Matches are pre-checked; everything else can be paired by hand from the
dropdown (which lists `Name (avatar-filename.png)` so same-named entries are
distinguishable), or sent to "+ Create new character card" instead.

Hitting "Sync Selected" copies the persona's name, description, and avatar
image onto the matched card — nothing else. Other card data (greetings,
alternate greetings, example dialogue, world info, etc.) is left exactly as
it is. `{{user}}`/`{{char}}` macros in the description are swapped in the
process: persona text is written from its own point of view (`{{user}}` =
itself), but on a character card the same entity is `{{char}}`, so the
macros are inverted to match. A successful sync is remembered, so re-running
it later re-targets the same card even if the name changes. Synced cards are
also tagged `Synced Persona` (created on first use) for easy filtering in the
character list.

## Requirements

Requires SillyTavern 1.18.0 or later, for the `/api/characters/merge-attributes`
endpoint (partial, deep-merge character updates) it relies on.

## Manual installation

```bash
git clone <this-repo-url> STPersonaSync
cd STPersonaSync
./install.sh /path/to/SillyTavern
```

This installs the extension into `/path/to/SillyTavern/public/scripts/extensions/third-party/STPersonaSync/`. Re-running the same command overwrites the installed copy to update it.

## Reloading SillyTavern

No server restart needed — SillyTavern discovers extensions on page load, so just reload the tab. If a JS update doesn't seem to take effect, hard-refresh (Cmd+Shift+R / Ctrl+Shift+R) to clear the browser cache.

## License

[MIT](LICENSE.md)
