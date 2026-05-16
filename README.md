# AutoScribe
![AutoScribe Logo](https://imgur.com/8xY8F1E.png)
Automated Documentation and Code Analysis Tool
[![Build Status](https://img.shields.io/travis/SudeshDahale/AutoScribe/master)](https://travis-ci.org/SudeshDahale/AutoScribe)
[![Code Coverage](https://img.shields.io/codecov/c/github/SudeshDahale/AutoScribe)](https://codecov.io/gh/SudeshDahale/AutoScribe)
[![License](https://img.shields.io/github/license/SudeshDahale/AutoScribe)](https://github.com/SudeshDahale/AutoScribe/blob/master/LICENSE)

AutoScribe is an innovative tool designed to automate the process of generating documentation and analyzing code. With its cutting-edge technology, it simplifies the development process, making it easier for developers to focus on what matters most - writing high-quality code.

![Futuristic Cityscape](https://source.unsplash.com/1600x900/?futuristic-cityscape)

## Feature Highlights
* Automated documentation generation
* Code analysis and parsing
* Incremental updates and staleness detection
* GitHub integration for seamless repository management
* Webhook support for real-time updates

## Tech Stack
| Technology | Description |
| --- | --- |
| Python | Primary programming language |
| TypeScript | Frontend development language |
| React | Frontend framework |
| GitHub API | Repository management and integration |
| Webhooks | Real-time update notifications |

## Project Structure
```markdown
backend/
app/
api/
auth.py
docs_gen.py
health.py
parse.py
prompt_editor.py
repositories.py
search.py
staleness.py
webhooks.py
core/
config.py
database.py
doc_generator.py
github_fetch.py
incremental_updater.py
parser.py
rag.py
staleness_detector.py
models/
analysis_job.py
documentation.py
file_snapshot.py
parsed_file.py
repository.py
user.py
webhook_config.py
workers/
tasks.py
test/
test_health.py
test_incremental_update.py
test_staleness.py
frontend/
src/
App.tsx
constants.ts
types.ts
components/
LoginPage.tsx
PromptEditorModal.tsx
Sidebar.tsx
StatsStrip.tsx
TabBar.tsx
TopBar.tsx
panels/
AnalyticsPanel.tsx
```

## Quick-start Guide
1. Clone the repository: `git clone https://github.com/SudeshDahale/AutoScribe.git`
2. Install dependencies: `pip install -r requirements.txt` (backend) and `npm install` (frontend)
3. Start the backend server: `python backend/app/main.py`
4. Start the frontend development server: `npm start`

![Robot Coding](https://source.unsplash.com/1600x900/?robot-coding)

## API Overview
The AutoScribe API provides endpoints for the following functionality:
* Authentication: `POST /api/auth/github_login`
* Documentation generation: `POST /api/docs_gen/generate_repo_readme`
* Code analysis: `POST /api/parse/parse_repository`
* Search: `GET /api/search/semantic_search`
* Webhooks: `POST /api/webhooks/handle_github_webhook`

## Contributing
Contributions are welcome and appreciated. To contribute, please fork the repository and submit a pull request with your changes.

## License
AutoScribe is licensed under the [MIT License](https://github.com/SudeshDahale/AutoScribe/blob/master/LICENSE).

![Futuristic Space Station](https://source.unsplash.com/1600x900/?futuristic-space-station)