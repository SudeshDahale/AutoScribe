# AutoScribe
Automated documentation and code analysis tool for GitHub repositories.
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Quality](https://img.shields.io/badge/Code%20Quality-A-%23ff0000.svg)](https://github.com/SudeshDahale/AutoScribe)
[![Documentation](https://img.shields.io/badge/Documentation-Yes-%2300ff00.svg)](https://github.com/SudeshDahale/AutoScribe)

## Feature Highlights
* Automated documentation generation for GitHub repositories
* Code analysis and staleness detection
* Support for multiple programming languages
* Integration with GitHub webhooks for real-time updates
* User-friendly interface for repository management and analytics

## Tech Stack
| Technology | Description |
| --- | --- |
| Python | Backend programming language |
| TypeScript | Frontend programming language |
| GitHub API | Integration with GitHub for repository management |
| SQLite | Database management system |
| React | Frontend framework |

## Project Structure
The project is divided into two main directories: `backend` and `frontend`. The `backend` directory contains the server-side code, including API endpoints, database models, and business logic. The `frontend` directory contains the client-side code, including the user interface and JavaScript files.

## Quick-start Guide
1. Clone the repository: `git clone https://github.com/SudeshDahale/AutoScribe.git`
2. Install dependencies: `pip install -r requirements.txt` (backend) and `npm install` (frontend)
3. Start the backend server: `python backend/app/main.py`
4. Start the frontend server: `npm start`
5. Access the application at `http://localhost:3000`

## API Overview
The API provides the following endpoints:
* `GET /api/health`: Health check endpoint
* `POST /api/login`: Login endpoint
* `GET /api/repositories`: List repositories endpoint
* `POST /api/repositories`: Create repository endpoint
* `GET /api/repositories/{id}`: Get repository endpoint
* `PUT /api/repositories/{id}`: Update repository endpoint
* `DELETE /api/repositories/{id}`: Delete repository endpoint
* `GET /api/documentation`: Get documentation endpoint
* `POST /api/documentation`: Generate documentation endpoint

## Contributing
Contributions are welcome! Please submit a pull request with your changes and a brief description of what you've done.

## License
AutoScribe is licensed under the MIT License. See [LICENSE](https://github.com/SudeshDahale/AutoScribe/blob/main/LICENSE) for details.