# Kubernetes

Cloud Task Orchestrator includes local-development Kubernetes manifests for Docker Desktop Kubernetes or minikube.

The manifests are intentionally simple:

- One namespace: `cloud-task-orchestrator`
- One ConfigMap for shared runtime settings
- Redis Deployment and Service
- Backend Deployment and Service
- Worker Deployment and HorizontalPodAutoscaler
- Frontend Deployment and Service
- Liveness and readiness probes
- Resource requests and limits

## Manifests

```text
k8s/
  namespace.yaml
  configmap.yaml
  redis.yaml
  backend.yaml
  worker.yaml
  frontend.yaml
```

## Build Local Images

The Kubernetes manifests reference these local image names:

- `cloud-task-orchestrator-backend:latest`
- `cloud-task-orchestrator-worker:latest`
- `cloud-task-orchestrator-frontend:latest`

With Docker Desktop Kubernetes, build them with:

```bash
docker compose build
```

With minikube, build the images inside minikube's Docker environment:

```bash
eval "$(minikube docker-env)"
docker build -t cloud-task-orchestrator-backend:latest ./backend
docker build -t cloud-task-orchestrator-worker:latest ./worker
docker build -t cloud-task-orchestrator-frontend:latest ./frontend
```

## Deploy

```bash
kubectl apply -f k8s/
```

Wait for pods:

```bash
kubectl -n cloud-task-orchestrator get pods
kubectl -n cloud-task-orchestrator rollout status deployment/redis
kubectl -n cloud-task-orchestrator rollout status deployment/backend
kubectl -n cloud-task-orchestrator rollout status deployment/worker
kubectl -n cloud-task-orchestrator rollout status deployment/frontend
```

## Inspect

List all resources:

```bash
kubectl -n cloud-task-orchestrator get all
```

Check services:

```bash
kubectl -n cloud-task-orchestrator get svc
```

Check worker autoscaling:

```bash
kubectl -n cloud-task-orchestrator get hpa
```

View logs:

```bash
kubectl -n cloud-task-orchestrator logs deployment/backend
kubectl -n cloud-task-orchestrator logs deployment/worker
kubectl -n cloud-task-orchestrator logs deployment/frontend
kubectl -n cloud-task-orchestrator logs deployment/redis
```

Describe a pod if it is not ready:

```bash
kubectl -n cloud-task-orchestrator describe pod <pod-name>
```

## Port Forward

Backend API, in one terminal:

```bash
kubectl -n cloud-task-orchestrator port-forward svc/backend 8000:8000
```

Frontend dashboard, in another terminal:

```bash
kubectl -n cloud-task-orchestrator port-forward svc/frontend 5173:5173
```

Open:

```text
http://localhost:5173
```

The frontend uses `VITE_API_URL=http://localhost:8000`, so keep the backend port-forward running while using the dashboard.

## Smoke Test

With the backend port-forward running:

```bash
./scripts/smoke_test.sh
```

Or explicitly:

```bash
API_BASE_URL=http://localhost:8000 ./scripts/smoke_test.sh
```

## Cleanup

Delete the stack:

```bash
kubectl delete -f k8s/
```

Or delete the namespace:

```bash
kubectl delete namespace cloud-task-orchestrator
```

## Notes

- The worker HPA scales from 2 to 5 replicas based on CPU utilization.
- The HPA requires metrics support, such as `metrics-server`, to report live scaling metrics.
- Redis is configured for local development without persistent storage.
- Services use `ClusterIP`; access the frontend and backend with `kubectl port-forward`.
- These manifests are local-dev friendly and are not intended to be a hardened production deployment.
