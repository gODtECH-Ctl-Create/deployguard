# DeployGuard Kubernetes Runtime

This directory contains baseline Kubernetes manifests for running DeployGuard with runtime probes.

These manifests are intended for development clusters, review environments, and benchmark validation. They are not a production SLO, security or availability claim.

## Layout

```text
k8s/base/
  namespace.yaml
  configmap.yaml
  secret.example.yaml
  postgres.yaml
  api.yaml
  web.yaml
  kustomization.yaml
```

## Runtime checks

- API readiness and liveness use `GET /health` on port `4000`.
- Web readiness and liveness use `GET /` on port `3000`.
- PostgreSQL readiness and liveness use `pg_isready`.

The API `/health` endpoint checks database connectivity, so the API pods will not become ready while PostgreSQL is unavailable.

## Before applying

The manifests use local image placeholders:

- `deployguard-api:local`
- `deployguard-web:local`

For a real cluster, build and push images to your registry, then replace the image values before applying the manifests.

The example secret is intentionally committed with placeholder values only. For real use, create your own secret instead of applying the example unchanged.

## Apply to a cluster

For a local cluster where the images already exist:

```bash
kubectl apply -k k8s/base
kubectl -n deployguard get pods
kubectl -n deployguard rollout status deployment/deployguard-postgres
kubectl -n deployguard rollout status deployment/deployguard-api
kubectl -n deployguard rollout status deployment/deployguard-web
```

To inspect probe behavior:

```bash
kubectl -n deployguard describe deployment deployguard-api
kubectl -n deployguard describe deployment deployguard-web
kubectl -n deployguard describe deployment deployguard-postgres
```

## Operator notes

- Replace `secret.example.yaml` with a real secret workflow before production use.
- Add ingress, TLS, network policies, external PostgreSQL and observability separately.
- Keep deployment verification evidence separate from provider credit or token-saving claims.
