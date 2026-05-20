const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  let body = null;
  const text = await response.text();
  if (text) {
    body = JSON.parse(text);
  }

  if (!response.ok) {
    const message = body?.detail ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body;
}

export function getHealth() {
  return request("/health");
}

export function getJobs() {
  return request("/jobs");
}

export function createJob(job) {
  return request("/jobs", {
    method: "POST",
    body: JSON.stringify(job),
  });
}
