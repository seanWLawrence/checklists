# File Organizer Plan

## Goal

Add a top-level **Files** feature for storing and finding personal files that
have inconsistent original names and locations. Files are stored privately in
S3 with predictable, useful prefixes so the S3 archive is valuable as a backup
without relying on the application. The first release supports isolated
archives for multiple users.

The feature is independent of Journals and Logs.

## Product principles

- Keep the folder structure small, stable, and useful outside the app.
- Do not maintain an exhaustive catalog of file types or aliases.
- Let AI extract flexible details (kind, title, entities, dates, tags), while
  server code owns validation, access control, and S3-key generation.
- Prefer native text extraction; defer automatic OCR until there is evidence it
  is valuable.
- Use semantic search for human-language queries and structured metadata when
  it is available.
- Organize files automatically, while keeping every classification editable.

## User experience

### Files page

`/files` provides:

- Drag-and-drop and multi-file upload.
- PDF, images, MP3, and other supported audio formats, with a 100 MB per-file
  limit for the first release.
- Recent uploads and processing status.
- Search and broad category/date filters.
- Clear states: `uploaded`, `processing`, `ready`, `needs-review`, and
  `failed`.
- A **Keep content out of AI processing** option for sensitive uploads.

### File detail page

`/files/[id]` provides:

- Preview and download.
- Original upload filename and final organized S3 location.
- Extracted title, category, kind, date, entities, and tags.
- Editable corrections; correcting metadata regenerates the S3 key and moves
  the object so the backup hierarchy remains accurate.
- A manual-classification form for files whose content must not be sent to an
  AI provider.

## Storage model

Original files live in S3. DynamoDB is the source of truth for application
metadata and search records.

```text
S3
  files/{userId}/_incoming/{fileId}/{originalFilename}
  files/{userId}/{final organized prefix}/{generated filename}

DynamoDB
  File record: owner, S3 key, status, classification, audit data
  File chunk records: searchable excerpt, page reference, embedding
```

The staging prefix is private and temporary. Every S3 key and DynamoDB lookup
is scoped to the authenticated user. A file is moved to its final location
automatically after its processing result has been validated; the user can
subsequently correct its metadata and location.

## Classification metadata

The classification response has a stable shape, but `kind` is deliberately
flexible. There is no requirement to predefine every document type.

```ts
type FileClassification = {
  topLevelCategory:
    | "financial"
    | "taxes"
    | "work"
    | "health"
    | "insurance"
    | "home"
    | "identity"
    | "education"
    | "books"
    | "music"
    | "photos"
    | "other";
  kind: string;
  title: string;
  primaryDate?: string;
  year?: number;
  entities: string[];
  tags: string[];
  summary?: string;
  confidence: number;
};
```

Examples:

```text
Work:   kind = job-contract
Health: kind = medical-bill
Taxes:  kind = w-2
```

The worker validates this shape and converts user-facing fields to safe slugs;
the model never writes a raw S3 key.

## Consistent filenames and prefixes

Use one universal filename template, omitting optional pieces when absent:

```text
{primary-date-or-year}--{kind}--{primary-entity}--{fileId}.{extension}
```

Examples:

```text
documents/work/2025/job-contract/
  2025-03-01--job-contract--acme-corporation--f_01KQ9B.pdf

documents/health/2026/medical-bill/
  2026-08-04--medical-bill--northwestern-medicine--f_01L2X7.pdf

documents/taxes/2018/w-2/
  2018--w-2--acme-corporation--f_01J8A2.pdf
```

The stable file ID prevents collisions. Original filenames remain in metadata.
Never put highly sensitive values, such as Social Security, account, employee,
or policy numbers, in a filename or S3 key.

## Ingestion flow

```text
Files UI
  -> obtain a presigned S3 upload URL
  -> browser uploads directly to the private staging prefix
  -> create DynamoDB File record (uploaded)
  -> enqueue file-classification job in SQS
  -> worker validates, extracts, classifies, indexes, and organizes the file
  -> update File record (ready, needs-review, or failed)
```

The browser uploads directly to S3 so large files do not flow through the
Next.js application.

## Extraction strategy

### MVP: native extraction only

Extract text or metadata locally in the background worker where possible:

- PDF: native text.
- DOCX: document XML.
- EPUB: metadata and HTML text.
- TXT: source content.
- MP3: ID3 metadata.

If the file has no useful native text, mark it `needs-review`. It can still be
downloaded, manually categorized, and found using its metadata.

### Sensitive-upload mode

All objects are private and access-controlled. The upload option is an
additional processing restriction, not an access-control setting: **Keep
content out of AI processing** means extracted content must not be sent to the
configured AI provider for classification or embeddings.

In this mode, the file is stored and the user is shown a manual-classification
form for its broad category, kind, title, date, entities, and tags. Search can
use this manually supplied metadata and the original filename, but does not use
content-derived AI classification or vector embeddings. Native extraction may
remain available for a future local-only workflow, but is not required for the
first release.

### Later: opt-in OCR

For a scanned image or PDF, use asynchronous Amazon Textract processing:

```text
worker detects insufficient text
  -> starts Textract job for the staged S3 object
  -> Textract publishes completion through SNS/SQS
  -> OCR completion worker collects text
  -> normal classification/indexing flow continues
```

Start with basic text detection only. Defer costly/specialized form, table,
receipt, and identity analysis until a concrete need exists. Provide an
individual "Extract text" action before enabling automatic OCR, and set page
and file-size caps.

## Search

Search begins with DynamoDB vector search over an embedding made from the
title, kind, tags, summary, and extracted text. This supports queries such as
"the tax form from my old job" without a hand-maintained dictionary of every
possible file type.

Generic text normalization is only mechanical and applies equally at indexing
and query time:

```text
"W2", "W-2", and "w 2" -> "w2"
"ACME, Inc." -> "acme inc"
```

This normalized title/tag/filename matching supplements semantic results. The
system can also apply broad, generic filters when clear values are present,
such as a four-digit year or top-level category. It should not depend on a
large set of domain-specific `if` statements.

Merge, deduplicate, and rank results at the file level. A matching text chunk
links back to its parent File record and then to a short-lived presigned S3
download URL.

## DynamoDB vector-search direction

Use DynamoDB for File records and vector search initially. This avoids keeping
a separate vector store synchronized with file metadata and is appropriate for
a personal archive. Keep the vector-search code behind a narrow interface so
S3 Vectors remains an option if corpus size or pricing later favors it.

## Delivery slices

1. **Foundation:** Files navigation/pages, File records, direct S3 upload,
   broad categories, deterministic S3-key generation, manual correction,
   multi-file upload, and multi-user isolation.
2. **Automatic organization:** background native extraction, structured
   classification, processing states, final object moves, and the sensitive
   upload/manual-classification path.
3. **Discovery:** DynamoDB vector indexing/search plus normalized metadata,
   title, and filename matching.
4. **Enhancements:** opt-in OCR, duplicate detection, bulk imports, and
   optional learned correction rules if repeated errors justify them.
