#!/bin/sh
# Runs from the nginx image's entrypoint (/docker-entrypoint.d/) before nginx starts: writes the
# viewer's config.json from the DOCS_* environment variables.
set -eu

json_string() {
  printf '"%s"' "$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g')"
}

if [ -d /srv/source ] && [ -n "$(ls -A /srv/source 2>/dev/null)" ]; then
  source=true
else
  source=false
fi

if [ ! -d /srv/docs ]; then
  echo "docs-viewer: nothing mounted at /srv/docs; mount your docs folder there" >&2
fi

cat > /usr/share/docs-viewer/config.json <<JSON
{"title":$(json_string "$DOCS_TITLE"),"docsPath":$(json_string "$DOCS_PATH"),"source":$source}
JSON

echo "docs-viewer: title=\"$DOCS_TITLE\" docsPath=$DOCS_PATH source=$source listen=$DOCS_LISTEN"
