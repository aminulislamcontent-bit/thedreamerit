# Historical project archive

The repository's `main` branch contained a separate Next.js 16 / Prisma project immediately before PR #1 was merged. Its exact source tree is retained in the merge history at commit [`4a90c8b962c55f857e3395750783c48d6eca4ce4`](https://github.com/aminulislamcontent-bit/thedreamerit/commit/4a90c8b962c55f857e3395750783c48d6eca4).

The merge commit has both histories as parents. To inspect or export that previous tree without mixing it into the active application:

```bash
git archive --format=tar 4a90c8b962c55f857e3395750783c48d6eca4 | tar -xf - -C /tmp/thedreamerit-legacy
```

The previous project is **historical, not the active app**, and has not been ported or re-tested here. Its old source and docs include demo/sample setup and credentials; do not deploy or reuse it without a security review, credential rotation, data verification, and a fresh test/build. The active root app is the verification-gated Next.js 15 platform documented in `README.md` and `FINAL_REPORT.md`.
