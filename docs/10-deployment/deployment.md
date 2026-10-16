# Deployment

Environments:
Development -> QA -> Staging -> Production

Docker:
frontend
api
postgres
nginx
optional monitoring

CI:
Install -> Lint -> Build -> Unit -> Integration -> Docker -> Security

CD:
Staging -> Smoke -> UAT/Approval -> Production -> Health Check -> Monitoring

Backups:
Automated PostgreSQL backup + retention + restore testing.
