## ADDED Requirements

### Requirement: Backoffice exposes a Messages section to admin and agents

The admin panel SHALL include a "Messages" navigation entry and route (`/admin/messages`) accessible to users with the `admin` or `agent` role, listing contact submissions. Users without those roles SHALL NOT see the entry or reach the page.

#### Scenario: Admin or agent sees Messages in the nav

- **WHEN** a signed-in admin or agent loads the admin panel
- **THEN** a "Messages" entry with an icon appears in the sidebar navigation
- **AND** navigating to `/admin/messages` renders the list of contact submissions

#### Scenario: Unauthorized user cannot access Messages

- **WHEN** a user without the `admin` or `agent` role attempts to load `/admin/messages`
- **THEN** access is denied by the existing role guard
- **AND** the Messages entry is not shown in their navigation

### Requirement: Messages list shows submissions and a new-message indicator

The Messages list SHALL display contact submissions ordered most-recent first, showing at least the submitter name, email, ZIP, status, and submission time, and the navigation SHALL show a count badge of submissions in the `new` status.

#### Scenario: List renders submissions newest-first

- **WHEN** an admin or agent opens `/admin/messages`
- **THEN** contact submissions are listed ordered by creation time descending
- **AND** each row shows the submitter name, email, ZIP code, status, and submission time

#### Scenario: New-message badge reflects unread count

- **WHEN** there are submissions with status `new`
- **THEN** the Messages nav entry displays a badge with the count of `new` submissions
- **AND** when there are no `new` submissions the badge is absent

#### Scenario: Empty state

- **WHEN** there are no contact submissions
- **THEN** the list renders an empty-state message instead of an empty table

### Requirement: A single message can be viewed and triaged

An admin or agent SHALL be able to open a single submission and change its status between `new`, `read`, and `archived`.

#### Scenario: View a single message

- **WHEN** an admin or agent opens a submission detail
- **THEN** the full message content and all submitted fields (name, email, phone, ZIP, message, consent, submission time) are shown

#### Scenario: Mark a message read or archived

- **WHEN** an admin or agent marks a submission as read or archived
- **THEN** the submission's status is updated and persisted
- **AND** the list and the new-message badge reflect the updated status
