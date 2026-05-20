const STATUS_ORDER = ["QUEUED", "RUNNING", "COMPLETED", "FAILED"];
const TASK_TYPES = ["text_transform", "data_cleanup", "file_summary"];

export function deriveJobMetrics(jobs) {
  const statusCounts = STATUS_ORDER.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
  const taskTypeCounts = TASK_TYPES.reduce((acc, taskType) => ({ ...acc, [taskType]: 0 }), {});
  let retryTotal = 0;

  for (const job of jobs) {
    if (job.status in statusCounts) {
      statusCounts[job.status] += 1;
    }

    if (job.task_type in taskTypeCounts) {
      taskTypeCounts[job.task_type] += 1;
    }

    retryTotal += Number(job.retry_count ?? 0);
  }

  const stats = {
    total: jobs.length,
    queued: statusCounts.QUEUED,
    running: statusCounts.RUNNING,
    completed: statusCounts.COMPLETED,
    failed: statusCounts.FAILED,
  };

  return {
    stats,
    statusData: STATUS_ORDER.map((status) => ({
      name: status,
      value: statusCounts[status],
    })),
    taskTypeData: TASK_TYPES.map((taskType) => ({
      name: taskType,
      value: taskTypeCounts[taskType],
    })),
    throughputData: buildThroughputData(jobs),
    pipelineData: [
      { name: "Submitted", value: jobs.length },
      { name: "Queued", value: statusCounts.QUEUED },
      { name: "Running", value: statusCounts.RUNNING },
      { name: "Completed", value: statusCounts.COMPLETED },
      { name: "Failed", value: statusCounts.FAILED },
    ],
    insights: {
      queueDepth: statusCounts.QUEUED,
      activeJobs: statusCounts.RUNNING,
      completedJobs: statusCounts.COMPLETED,
      failedJobs: statusCounts.FAILED,
      averageRetryCount: jobs.length === 0 ? 0 : retryTotal / jobs.length,
    },
  };
}

function buildThroughputData(jobs) {
  const buckets = new Map();

  for (const job of jobs) {
    addToBucket(buckets, job.created_at, "submitted");

    if (job.status === "COMPLETED") {
      addToBucket(buckets, job.updated_at, "completed");
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([timestamp, value]) => ({
      time: formatBucketLabel(timestamp),
      submitted: value.submitted,
      completed: value.completed,
    }));
}

function addToBucket(buckets, timestamp, field) {
  if (!timestamp) {
    return;
  }

  const bucketTimestamp = floorToHour(new Date(timestamp)).getTime();
  const current = buckets.get(bucketTimestamp) ?? { submitted: 0, completed: 0 };
  current[field] += 1;
  buckets.set(bucketTimestamp, current);
}

function floorToHour(date) {
  const bucket = new Date(date);
  bucket.setMinutes(0, 0, 0);
  return bucket;
}

function formatBucketLabel(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
  }).format(new Date(timestamp));
}
