#!/usr/bin/env bash
set -euo pipefail

readonly EXTENSION_NAME="STPersonaSync"
readonly EXTENSION_FILES=(manifest.json index.js style.css settings.html)
readonly EXTENSION_DIRS=(modules)

usage() {
    echo "Usage: $(basename "$0") <path-to-sillytavern-root>" >&2
    exit 1
}

if [[ $# -ne 1 ]]; then
    usage
fi

st_root="$1"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -f "${st_root}/public/script.js" ]]; then
    echo "Error: '${st_root}' does not look like a SillyTavern install (missing public/script.js)" >&2
    exit 1
fi

target_dir="${st_root}/public/scripts/extensions/third-party/${EXTENSION_NAME}"
mkdir -p "${target_dir}"

for file in "${EXTENSION_FILES[@]}"; do
    cp "${script_dir}/${file}" "${target_dir}/${file}"
done

for dir in "${EXTENSION_DIRS[@]}"; do
    rm -rf "${target_dir:?}/${dir}"
    cp -R "${script_dir}/${dir}" "${target_dir}/${dir}"
done

echo "Installed ${EXTENSION_NAME} to ${target_dir}"
