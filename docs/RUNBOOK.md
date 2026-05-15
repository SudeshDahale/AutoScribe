# Operational Runbook for SudeshDahale/AutoScribe
## 1. Service Overview and SLOs
The AutoScribe service is a documentation generation and management platform that utilizes GitHub webhooks to trigger incremental updates and staleness detection. The service has the following SLOs:
* **Uptime**: 99.9% per month
* **Response Time**: 500ms average response time for API requests
* **Error Rate**: Less than 1% error rate for API requests

![Service Overview](https://github.com/SudeshDahale/AutoScribe/blob/main/docs/service_overview.png)

## 2. Local Development Setup
To set up the service for local development:
1. Clone the repository: `git clone https://github.com/SudeshDahale/AutoScribe.git`
2. Install dependencies: `pip install -r requirements.txt`
3. Create a GitHub personal access token and add it to the `config.py` file
4. Run the service: `python main.py`

![Local Development Setup](https://github.com/SudeshDahale/AutoScribe/blob/main/docs/local_dev_setup.png)

## 3. Deployment Procedure
To deploy the service:
1. **Build the Docker image**: `docker build -t autoscribe .`
2. **Push the image to the registry**: `docker push autoscribe:latest`
3. **Deploy to Kubernetes**: `kubectl apply -f deployment.yaml`
4. **Verify the deployment**: `kubectl get pods`

![Deployment Procedure](https://github.com/SudeshDahale/AutoScribe/blob/main/docs/deployment_procedure.png)

## 4. Rollback Procedure
To roll back to a previous version:
1. **Identify the previous version**: `kubectl get deployments -o yaml`
2. **Update the deployment YAML**: `kubectl patch deployment autoscribe -p '{"spec":{"template":{"spec":{"containers":[{"name":"autoscribe","image":"autoscribe:<previous_version>"}]}}}}'`
3. **Apply the changes**: `kubectl apply -f deployment.yaml`
4. **Verify the rollback**: `kubectl get pods`

![Rollback Procedure](https://github.com/SudeshDahale/AutoScribe/blob/main/docs/rollback_procedure.png)

## 5. Common Failure Modes and Remediation
The following are common failure modes and their remediation:
* **Database connection issues**: Check the database connection string and credentials.
* **GitHub webhook failures**: Check the webhook configuration and GitHub API status.
* **Incremental update failures**: Check the incremental update configuration and repository permissions.

![Common Failure Modes](https://github.com/SudeshDahale/AutoScribe/blob/main/docs/common_failure_modes.png)

## 6. Monitoring and Alerting Checklist
The following are the monitoring and alerting checks:
* **Uptime monitoring**: Check the service uptime using a monitoring tool like Prometheus.
* **Response time monitoring**: Check the average response time using a monitoring tool like Prometheus.
* **Error rate monitoring**: Check the error rate using a monitoring tool like Prometheus.
* **Database connection monitoring**: Check the database connection status using a monitoring tool like Prometheus.
* **GitHub webhook monitoring**: Check the webhook configuration and GitHub API status using a monitoring tool like Prometheus.

![Monitoring and Alerting Checklist](https://github.com/SudeshDahale/AutoScribe/blob/main/docs/monitoring_alerting_checklist.png)

## 7. On-call Escalation Path
The on-call escalation path is as follows:
1. **Primary on-call engineer**: The primary on-call engineer is responsible for responding to alerts and resolving issues.
2. **Secondary on-call engineer**: The secondary on-call engineer is responsible for supporting the primary on-call engineer and resolving issues if the primary engineer is unavailable.
3. **Engineering team**: The engineering team is responsible for supporting the on-call engineers and resolving complex issues.

![On-call Escalation Path](https://github.com/SudeshDahale/AutoScribe/blob/main/docs/on_call_escalation_path.png)