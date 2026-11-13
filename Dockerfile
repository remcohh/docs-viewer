# docs-viewer: an nginx image that renders a mounted docs folder (Markdown + Mermaid) in the browser.
# See README.md for the mounts and environment variables.

# Browser libraries, pinned in vendor/package-lock.json. Bundled so browsers never hit a CDN.
FROM node:22-alpine AS vendor
WORKDIR /vendor
COPY vendor/package.json vendor/package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

FROM nginx:1.28-alpine
ENV DOCS_TITLE=Docs \
    DOCS_PATH=docs \
    DOCS_LISTEN=80 \
    NGINX_ENVSUBST_FILTER=^DOCS_

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/docs-viewer-files.conf /etc/nginx/docs-viewer-files.conf
COPY --chmod=755 nginx/40-docs-viewer-config.sh /docker-entrypoint.d/40-docs-viewer-config.sh
COPY viewer/ /usr/share/docs-viewer/
COPY --from=vendor \
    /vendor/node_modules/mermaid/dist/mermaid.min.js \
    /vendor/node_modules/marked/marked.min.js \
    /vendor/node_modules/dompurify/dist/purify.min.js \
    /usr/share/docs-viewer/vendor/

EXPOSE 80
