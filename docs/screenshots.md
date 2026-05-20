# Screenshot Checklist

Use this checklist before publishing the project publicly. Store final images in a future `docs/assets/` folder, then update the placeholders below.

## Recommended Screenshots

### 1. Dashboard Overview

Placeholder:

```md
![Dashboard overview](docs/assets/dashboard-overview.png)
```

Capture:

- Header with `Local Stack` badge.
- Health cards.
- Submit Job panel.
- Jobs table.
- Queue pipeline and worker insights.
- System Snapshot or selected job inspector.

### 2. Job Submission

Placeholder:

```md
![Job submission](docs/assets/job-submission.png)
```

Capture:

- `Submit job` card.
- `task_type` dropdown.
- JSON payload editor.
- Submit button.

### 3. Completed Job Inspector

Placeholder:

```md
![Completed job inspector](docs/assets/completed-job-inspector.png)
```

Capture:

- Selected row in the jobs table.
- Inspector with `COMPLETED` status.
- Payload and result blocks.
- Retry count and timestamps.

### 4. Observability Charts

Placeholder:

```md
![Observability charts](docs/assets/observability-charts.png)
```

Capture:

- Job throughput chart.
- Job status donut chart.
- Task type breakdown.
- System architecture card.

### 5. Dark Theme

Placeholder:

```md
![Dark theme](docs/assets/dark-theme.png)
```

Capture:

- Dashboard after selecting the `Dark` theme.
- Verify status colors and chart contrast.

### 6. Light Theme

Placeholder:

```md
![Light theme](docs/assets/light-theme.png)
```

Capture:

- Dashboard after selecting the `Light` theme.
- Verify shadows, borders, and table selection state.

## Capture Tips

- Start from a clean browser window.
- Run `docker compose up --build`.
- Submit at least one job of each task type.
- Select a completed job before capturing the inspector.
- Capture at desktop width first, then optionally capture mobile/tablet responsive views.
- Avoid screenshots with browser developer tools open.
- Make sure no private local paths or unrelated browser tabs are visible.

## Optional Responsive Screenshots

Placeholders:

```md
![Mobile dashboard](docs/assets/mobile-dashboard.png)
![Tablet dashboard](docs/assets/tablet-dashboard.png)
```

Capture:

- Inspector stacked below jobs table on smaller screens.
- Submit Job remains easy to find.
- Charts remain readable.
