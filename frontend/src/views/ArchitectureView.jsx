import { Boxes, Container, Network } from "lucide-react";

import { ArchitectureCard } from "../components/ObservabilitySection.jsx";

export function ArchitectureView() {
  return (
    <section className="view-stack architecture-view" aria-label="Architecture">
      <ArchitectureCard />
      <div className="architecture-note-grid">
        <InfoCard
          icon={Container}
          title="Docker Compose runtime"
          body="Runs Redis, FastAPI, worker, and Vite dashboard on a shared local network with service health checks. Single command to spin up the full stack."
        />
        <InfoCard
          icon={Boxes}
          title="Kubernetes ready"
          body="Includes namespace, ConfigMap, Deployments, Services, probes, resource limits, and worker autoscaling via HorizontalPodAutoscaler."
        />
        <InfoCard
          icon={Network}
          title="Queue-first boundary"
          body="The API accepts jobs quickly, Redis absorbs queue state, and workers process asynchronously. Decoupled submission from execution."
        />
      </div>
    </section>
  );
}

function InfoCard({ body, icon: Icon, title }) {
  return (
    <article className="panel info-card">
      <div className="info-card-icon" aria-hidden="true">
        <Icon size={17} />
      </div>
      <h2>{title}</h2>
      <p>{body}</p>
    </article>
  );
}
