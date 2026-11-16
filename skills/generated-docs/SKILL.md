---
name: generated-docs
description: Write or regenerate docs and diagrams in a project's docs/ folder from a developer's prompt. Use when drawing a diagram or writing an explanatory doc from the code, or when asked to regenerate or refresh one.
---

A generated doc is the answer to a **prompt** the developer owns. The prompt is the spec; the body
is what the code makes true of it today. Regenerating means answering the prompt again from the
codebase as it is now.

## The prompt

The doc's leading comment holds it: `%%` lines in a `.mmd` file, one `<!-- -->` comment at the
very top of a `.md` file (both stay invisible in the docs viewer).

```
%% prompt:
%%   <what the doc must show, for whom, the diagram type, the area of code it covers, what is out of scope>
```

The developer is responsible for the prompt: keep their words. When it is ambiguous, or the work
forces a scope decision, propose the new wording and write it into the header only once the
developer accepts it.

## Investigating

Find the code from the prompt alone: every entry point and path in scope, including what is wired
in without an import (file-based routes, config registration, middleware). Done when each part of
the prompt maps to code you have read, and each claim you will make traces to a file.

## Writing a new doc

1. Draft the prompt from the request: audience, what must be shown, diagram type, the area of code
   it covers (a later run searches from it), what is out of scope. The header gets the version the
   developer accepts.
2. Investigate, then write the body.

## Regenerating

1. Investigate before reading the old body, so it cannot narrow the search.
2. Audit the old body claim by claim against the code: confirmed, corrected or removed. A claim
   pointing at code the investigation missed gets checked there; one that holds but falls outside
   the prompt goes into your report, with a proposed prompt change.
3. Write the new body, keeping the old layout and ordering where they still hold, so the diff shows
   changed claims rather than reshuffling.
4. Done when the diagram renders in the docs viewer. Report each changed claim with the file that
   proves it, and any prompt changes you propose.
