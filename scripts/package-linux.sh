#!/usr/bin/env bash
# Cross-package MedFlow on Linux with a per-user NSIS installer.
# This builds a Windows archive but cannot substitute for actual Windows testing.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
ROOT="$PWD"
VERSION="$(node -p 'require("./package.json").version')"
ARCH="${ARCH:-x64}"
case "$ARCH" in x64|ia32) ;; *) echo "ARCH must be x64 or ia32" >&2; exit 1 ;; esac
NSIS="${MAKENSIS:-$(find "$HOME/.cache/electron-builder/nsis" -path '*/linux/makensis' -type f 2>/dev/null | head -1 || true)}"
if [[ -z "$NSIS" || ! -x "$NSIS" ]]; then
  echo "NSIS compiler missing. Install Linux makensis or set MAKENSIS to its path." >&2
  exit 1
fi
npm run build
# --dir avoids Wine-only Windows resource editing. Installers/shortcuts still use our brand icon.
npx electron-builder --win dir "--$ARCH" --publish never -c.win.signAndEditExecutable=false
if [[ "$ARCH" == 'x64' ]]; then DIR="release/win-unpacked"; else DIR="release/win-ia32-unpacked"; fi
ADDON="$ROOT/$DIR/resources/app.asar.unpacked/node_modules/better-sqlite3"
# electron-builder can reuse the host's Linux .node on cross-build; forcibly install the
# correct Windows/Electron ABI binary into the package before it is wrapped by NSIS.
(cd "$ADDON" && "$ROOT/node_modules/.bin/prebuild-install" --runtime electron --target 22.3.27 --platform win32 --arch "$ARCH" --force)
if ! file "$ADDON/build/Release/better_sqlite3.node" | grep -q 'PE32'; then
  echo "Windows SQLite addon validation failed; refusing to package." >&2
  exit 1
fi
OUT="$ROOT/release/MedFlow-Setup-${VERSION}-${ARCH}.exe"
"$NSIS" -V2 "-DAPP_DIR=$ROOT/$DIR" "-DOUT_FILE=$OUT" "-DAPP_ICON=$ROOT/assets/medflow.ico" "-DLICENSE_FILE=$ROOT/installer/LICENSE.txt" "$ROOT/installer/MedFlow.nsi"
echo "Built: $OUT"
# Cross-build may change local native dependencies; restore host addon for tests/dev server.
npm rebuild better-sqlite3 >/dev/null
