# Root instruction backup manifest

Created before changing any pre-existing root instruction file.

| Source path | Original Git object | Backup representation |
|---|---|---|
| `AGENTS.md` | blob `a8ab45e10b577b7f48d0fb872324e19a6600e045` | `docs/agent-governance/backups/2026-07-10/AGENTS.md` |
| `CLAUDE.md` | symlink blob `47dc3e3d863cfb5727b87d785d09abf9743c0a72` | `docs/agent-governance/backups/2026-07-10/CLAUDE.md.symlink-target.txt` |

The original `CLAUDE.md` blob contains exactly `AGENTS.md`, meaning the root Claude entry was a symbolic link to the root generic-agent instructions. The resolved target content is preserved by the `AGENTS.md` backup above.

Restore procedure:

1. Restore `AGENTS.md` from the backup file if its content changed.
2. Replace root `CLAUDE.md` with a symlink whose target is `AGENTS.md`.
3. Verify the resulting blobs or compare the restored text with the SHA values above.
