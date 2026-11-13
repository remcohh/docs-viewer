# docs-viewer

A Docker image that renders a project's `docs/` folder in the browser:

- `.md` files as pages (GitHub-flavoured Markdown), with ` ```mermaid ` blocks drawn as diagrams
- `.mmd` files as full-page Mermaid diagrams, with zoom and pan
- a sidebar tree of the folder, subfolders included
- relative links between docs, and `#/file.md#heading` links to headings

Nothing is built ahead of time: the page reads the mounted folder on each load, so an edited doc
shows up on reload. Mermaid, marked and DOMPurify are bundled into the image; browsers need no
internet access.

## Run it

```yaml
services:
  docs:
    image: ghcr.io/remcohh/docs-viewer:1
    ports: ['127.0.0.1:3003:80']
    environment:
      DOCS_TITLE: My project
    volumes:
      - ./docs:/srv/docs:ro
      - .:/srv/source:ro # optional, see below
```

Then open <http://localhost:3003/>. Or without Compose:

```sh
docker run --rm -p 127.0.0.1:3003:80 -v "$PWD/docs:/srv/docs:ro" ghcr.io/remcohh/docs-viewer:1
```

## Mounts

| Path | Required | What |
| --- | --- | --- |
| `/srv/docs` | yes | The docs folder. Dotfiles are hidden and never served. |
| `/srv/source` | no | The project root (the folder that contains `docs/`). Links from a doc to files outside `docs/`, such as `../Dockerfile`, open as code pages. Without it, those links show as plain text. Dotfiles (`.env`, `.git`), `node_modules` and key files (`.pem`, `.key`, `.p12`, `.pfx`, `.jks`, `.keystore`) are never served, and there are no directory listings. Everything else in the mount can be read through the viewer, so mount it only where the viewer is private. |

## Environment

| Variable | Default | What |
| --- | --- | --- |
| `DOCS_TITLE` | `Docs` | Shown in the sidebar, landing page and browser tab. |
| `DOCS_PATH` | `docs` | Where the docs folder sits inside the project root; used to resolve `../` links. |
| `DOCS_LISTEN` | `80` | nginx `listen` value, e.g. `127.0.0.1:3003` with `network_mode: host`. |

## Access control

There is none. Bind the container to localhost and put it behind a proxy that checks who's
asking. All the page's URLs are relative, so it works under a prefix: see
[examples/nginx-host.conf](examples/nginx-host.conf) for `/docs/` on an existing site.

## Generated docs

Two pieces for docs written by an AI agent from the code:

- **[skills/generated-docs](skills/generated-docs/SKILL.md)**: an agent skill describing a header
  each generated doc carries (the prompt, its sources and the commit it was generated at), and
  how to regenerate. Copy it into the project's `.claude/skills/`.
- **`docs-check`**: lists those docs whose sources changed since they were generated, and exits 1
  if any did. Node 20.1+, no dependencies; run it from the project root, inside its git repository:

  ```sh
  npx -y -p github:remcohh/docs-viewer#v1.0.0 docs-check docs
  ```

## Releasing

Push a `v*` tag (e.g. `v1.0.0`). The GitHub workflow builds the image for amd64 and arm64 and
pushes `ghcr.io/remcohh/docs-viewer:1.0.0`, `:1.0` and `:1`.

To build locally: `docker build -t docs-viewer .`

Browser library versions are pinned in [vendor/package.json](vendor/package.json); after changing
one, run `npm install --package-lock-only` in `vendor/`.
