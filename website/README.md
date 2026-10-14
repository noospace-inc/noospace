# Project Pulse

Tech Stack: Next JS
Project Management Platform — Product & Design Brief

1. Visual Language & UI System

The reference dashboard image should set the tone for the entire product. Carry these principles across every screen:

Layout: Fixed left icon-only sidebar (collapsible on hover/click) for primary navigation, a light neutral canvas background (soft off-white/lavender-grey), and content organized into rounded, elevated cards (16–20px corner radius, subtle drop shadow).

Color system: A neutral base (white/light-grey) with 3–4 pastel accent gradients (blue, pink, green, peach) used to differentiate cards and status states — not as random decoration, but as a coding system (e.g., a color per project category, per status, or per priority).

Typography: A clean geometric sans-serif. Large, bold headlines for page titles (e.g., "Dashboard"), medium-weight labels for card titles, and lighter-weight body text for secondary info.

Cards as the core building block: Every entity (a project, a schedule cell, an employee, a homework/task item) lives inside a rounded card with generous padding, a small icon or avatar, a title, and a lightweight progress indicator (thin progress bar or percentage badge) where relevant.

Data visualization: Charts (like the performance chart shown) use soft gradient fills under line charts, dotted comparison lines, and a floating tooltip callout with a small icon and short label — apply this same treatment to the punctuality score trends and project completion charts.

Avatars & people: Circular avatars, stacked/overlapping avatar groups for team members, shown consistently across project cards, timeline cells, and the leaderboard.

Top navigation bar: Pill-shaped segmented control for switching between primary sections, with a search icon, notification bell, and profile avatar aligned to the right.

Microinteractions: Hover states that lift cards slightly, smooth color transitions (e.g., orange → green when a task is approved), and toast/confirmation popups styled consistently with the card system (rounded, soft-shadowed, centered).

Use this visual system consistently across Dashboard, Projects, Employees, Calendar, and Profile so the product feels like one cohesive design language rather than five different tools.

2. Dashboard

The Dashboard is the command center — a single glance should tell a user everything they need to know without navigating elsewhere.

Include:

A summary strip of key metrics (active projects, pending approvals, upcoming deadlines, personal punctuality score) shown as compact stat cards.

A performance chart summarizing punctuality/completion trends over the week or month, styled like the reference chart (gradient area + comparison lines + hover tooltip).

A "Today's Schedule" card listing the user's tasks for the day with quick progress bars.

A leaderboard-style "Top Performers" widget showing the highest punctuality scores with avatars and rank.

Quick-access cards for recently viewed or in-progress projects.

3. Projects

3.1 Creating a Project

A guided creation flow (modal or dedicated page) collects:

Field Details Project Name Text input Team Members Multi-select searchable dropdown with avatar previews as members are added Team Leader Single-select searchable dropdown (one leader only) Project Links ("Props") Dynamic "+ Add Link" button that reveals two fields: Label and URL/Email. If the URL field is left empty, the system treats the entry as an email address that can only be copied, not opened. Description Multi-line notes field Visibility Toggle or radio: Public / Private

3.2 Project Detail Page

Opens as a dedicated full page showing:

Project name, description, visibility badge, and completion percentage (derived from schedule tracking).

Project Links displayed as neat chips/pills, each with a copy icon (copies to clipboard) and an open icon (launches in a new tab). Email-type links show a "copy only" icon with no external-link action.

Schedule Timeline, structured as a weekly calendar:

Row 1: date + weekday headers, fixed cell width/height.

Row 2: the task/schedule timeline aligned beneath each date.

A task spanning multiple days automatically merges its cells into one continuous block.

Each cell shows a single-line, truncated task label (ellipsis, no wrapping).

Click a cell → popup shows every team member's task for that slot, one at a time, in a clean carousel/list view.

3.3 Task Approval & Status Colors

Team Leader view: each task in the popup includes an "Approve Task" action.

On approval, the task turns green everywhere it appears (timeline cell + popup), visible to all team members in real time.

Default (unapproved) state is orange.

Missed deadline: if a task isn't approved by its due time, the pre-set Deduction Mark is automatically subtracted from that member's punctuality score, and the project page shows a small indicator (e.g., "-5") next to their task.

Incomplete tasks roll over to the next schedule slot, marked with a red indicator flagging it as overdue/carried-over.

3.4 Punctuality Score

Every team member (excluding the team leader) has a visible punctuality score on their profile card and in the team roster.

Scores update automatically based on approvals and deductions.

3.5 Team Leader Tools — Schedule Management

Leaders get an additional "Create / Edit Schedule" panel using the same timeline UI as the project page, with completed dates shown in grey.

Shift handler: each schedule block has a right-arrow handle above the timeline's first row — clicking it pushes that schedule (and everything after it) forward by one day.

Scheduling is only possible on visible/future dates.

Two ways to create a schedule:

"Add Schedule" button → opens a modal with: date picker, duration (in days), and a per-member task list (each member — including the leader — gets an "Add Task" button that opens a text field). A "Set as Last Schedule" checkbox marks the final entry. Confirm via an "Add" button.

Inline creation → Ctrl + Click a date, then Enter, opens the same modal pre-filled with that date and default duration.

Editing: clicking any existing timeline cell opens it for viewing/editing. Any edit triggers a visible change indicator on the corresponding cell in the project's read-only timeline view.

Deduction Marks field: leaders set a numeric penalty value applied automatically when a member misses a deadline.

Reverting a deduction: leaders can click an already-deducted mark on a past schedule to revert it, protected by a confirmation dialog ("Are you sure you want to revert this deduction?").

4. Users & Roles (Admin-only)

A dedicated administration panel for managing access:

Two roles only: Staff and Admin.

Table/card view of all users with role badges, search/filter, and the ability to promote/demote roles.

Clear audit indication of who changed what role and when.

Restricted entirely to Admin accounts — hidden from Staff navigation.

5. Employees

A directory of all employees, each shown as a profile card containing:

Profile photo, name, and role.

Count of completed and ongoing projects.

Punctuality score.

At the top of this page, feature a "Top 3 Punctuality" spotlight — highlighted cards (gold/silver/bronze accent) for the employees with the highest scores.

6. Calendar

Displays project timelines by plotting each project's start date (first scheduled task) and end date across a monthly/weekly calendar view.

"Mark a Date" button opens a modal to add a custom calendar note with:

Title/description text

Date picker

Importance level: Important / Moderate / Normal (shown with distinct color tags on the calendar)

7. Profile

A personal dashboard for each staff member showing:

Average punctuality score, completed projects, ongoing projects, and their personal schedule — each in a clean stat box.

Editable fields: name, email, GitHub link, bio, and additional links (using the same "Props" link system as projects — copy/open icons, email auto-detection).

Profile photo upload.

Logout action.

8. Authentication

Sign Up: Name, Email, GitHub link, Password.

Log In: Email and Password only.

Both screens should follow the same card-based, rounded, soft-gradient aesthetic as the rest of the app — centered card on a subtly gradient background, clear primary CTA button, and a toggle link between Sign Up / Log In.

9. Suggested UX Enhancements (beyond the original spec)

Empty states: friendly illustrations + short copy when a project has no schedule yet, or an employee has no completed projects.

Notifications bell: surfaces approvals needed, deductions applied, and upcoming deadlines.

Dark mode toggle for the sidebar (matches the small moon icon in the reference design).

Responsive behavior: timeline collapses to a scrollable horizontal strip on smaller screens; cards stack vertically on mobile.

Accessibility: ensure color-coded states (green/orange/red) are paired with icons or labels, not color alone, for colorblind accessibility.
shared you some of the img references

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://aurora-cadence-board.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/53360ca3-90f1-4145-bd0c-5b83aad3b9dc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>/website
npm ci
npm run dev
```
