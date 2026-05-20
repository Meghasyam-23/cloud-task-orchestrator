import { Play, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";

const payloadTemplates = {
  text_transform: '{\n  "text": "Cloud jobs should be observable and reliable."\n}',
  file_summary:
    '{\n  "text": "Cloud Task Orchestrator accepts work through an API. Redis stores queued job identifiers. Worker replicas process jobs and write results back for operators to inspect."\n}',
  data_cleanup: '{\n  "name": "daily-import",\n  "owner": "",\n  "tags": ["etl", "", null],\n  "metadata": {\n    "region": "us-central1",\n    "notes": null\n  }\n}',
};

export function JobForm({ submitting, onSubmit, compact = false }) {
  const [taskType, setTaskType] = useState("text_transform");
  const [payloadText, setPayloadText] = useState(payloadTemplates.text_transform);
  const [error, setError] = useState("");

  const currentTemplate = useMemo(() => payloadTemplates[taskType], [taskType]);

  function handleTaskTypeChange(event) {
    const nextTaskType = event.target.value;
    setTaskType(nextTaskType);
    setPayloadText(payloadTemplates[nextTaskType]);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const payload = JSON.parse(payloadText);
      await onSubmit({ task_type: taskType, payload });
    } catch (err) {
      setError(err instanceof SyntaxError ? "Payload must be valid JSON." : err.message);
    }
  }

  return (
    <section className="panel job-form-panel">
      <div className="panel-heading">
        <div>
          <h2>Submit job</h2>
          <p>Create work for the Redis-backed worker pool.</p>
        </div>
        <button className="ghost-icon-button" type="button" onClick={() => setPayloadText(currentTemplate)}>
          <Wand2 size={15} />
          <span>Template</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className={`job-form${compact ? " compact" : ""}`}>
        <label>
          <span>Task type</span>
          <select value={taskType} onChange={handleTaskTypeChange}>
            <option value="text_transform">text_transform</option>
            <option value="file_summary">file_summary</option>
            <option value="data_cleanup">data_cleanup</option>
          </select>
        </label>

        <label>
          <span>Payload</span>
          <textarea value={payloadText} onChange={(event) => setPayloadText(event.target.value)} spellCheck="false" />
        </label>

        {error ? <div className="inline-error">{error}</div> : null}

        <button className="submit-button" type="submit" disabled={submitting}>
          <Play size={15} />
          <span>{submitting ? "Submitting" : "Submit job"}</span>
        </button>
      </form>
    </section>
  );
}
