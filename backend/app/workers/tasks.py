from app.workers.celery_app import celery_app


@celery_app.task(name="analyze_repository")
def analyze_repository(repo_id: int):
    """Placeholder task — AST parsing & doc generation wired in Sprint 2+."""
    print(f"[AutoScribe] Queued analysis for repo_id={repo_id}")
    return {"status": "queued", "repo_id": repo_id}