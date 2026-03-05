# File Edit History and Rollback Design

## Goals

- Keep an editable history timeline for file content changes.
- Group frequent saves into a 5-minute version window.
- Support one-click rollback to a previous version.
- Store only time and content change data (no editor identity required).

## Decisions

- Use `file_change_logs` as the version timeline source.
- Keep history forever.
- Merge saves inside a 5-minute window into the latest `file_updated` record.
- Create an explicit `file_rollback` record when user restores a previous version.

## Data Model

- Existing table `file_change_logs` is reused.
- `before_state.content` and `after_state.content` store full text snapshots.
- `action` uses:
  - `file_updated` for normal edits.
  - `file_rollback` for restore actions.

## API Design

- `GET /api/file-manager/files/:id/history?limit=20`
  - Returns latest change logs sorted by `created_at desc`.
- `POST /api/file-manager/files/:id/rollback`
  - Input: `{ change_log_id: number }`
  - Restores file content to selected version, then writes `file_rollback`.

## Domain Behavior

- During `updateFile` content update:
  - Read current content as `before`.
  - Write new content as `after`.
  - If `before !== after`, write or merge change log by time window.
- During rollback:
  - Load target `change_log_id`.
  - Extract `after_state.content`.
  - Update current file content to that snapshot.
  - Append a new `file_rollback` change log.

## UI Design

- Extend markdown editor with a "Change history" panel:
  - Show timestamp, action, before preview, after preview.
  - Allow "Rollback" action per item with confirmation.
  - Refresh history after save and rollback.

## Error Handling

- Save or rollback API errors are surfaced in editor status.
- Invalid/missing change log for rollback returns 404/400.
- History fetch failure shows inline error in history panel.

