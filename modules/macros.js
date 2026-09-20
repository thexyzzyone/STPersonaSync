/**
 * Swaps {{user}}/{{char}} macros when copying text written from a persona's own
 * point of view onto a character card. In persona text {{user}} means "myself"
 * and {{char}} means "whoever I'm talking to"; on the resulting character card
 * those roles invert (the card IS the character now), so the macros must invert too.
 * @param {string} text
 * @returns {string}
 */
export function swapPersonaMacrosForCharacter(text) {
    if (!text) {
        return text;
    }

    const CHAR_PLACEHOLDER = '\u0000STPS_CHAR_PLACEHOLDER\u0000';
    const USER_PLACEHOLDER = '\u0000STPS_USER_PLACEHOLDER\u0000';

    return text
        .replace(/\{\{user\}\}/gi, CHAR_PLACEHOLDER)
        .replace(/\{\{char\}\}/gi, USER_PLACEHOLDER)
        .split(CHAR_PLACEHOLDER).join('{{char}}')
        .split(USER_PLACEHOLDER).join('{{user}}');
}
