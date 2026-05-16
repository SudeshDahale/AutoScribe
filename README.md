# AutoScribe
Automated documentation and code analysis tool for GitHub repositories.
[![GitHub issues](https://img.shields.io/github/issues/SudeshDahale/AutoScribe)](https://github.com/SudeshDahale/AutoScribe/issues)
[![GitHub forks](https://img.shields.io/github/forks/SudeshDahale/AutoScribe)](https://github.com/SudeshDahale/AutoScribe/network)
[![GitHub stars](https://img.shields.io/github/stars/SudeshDahale/AutoScribe)](https://github.com/SudeshDahale/AutoScribe/stargazers)

## Feature Highlights
* Automated documentation generation for GitHub repositories
* Code analysis and staleness detection
* Support for multiple programming languages
* Webhook integration for real-time updates
* User authentication and authorization

## Tech Stack
| Technology | Description |
| --- | --- |
| Python | Backend programming language |
| TypeScript | Frontend programming language |
| GitHub API | Repository data source |
| Webhooks | Real-time update mechanism |
| Database | Data storage and management |

## Project Structure
The project is divided into two main components:
* `backend`: Contains the server-side logic, including API endpoints, database interactions, and webhook handling.
* `frontend`: Contains the client-side logic, including the user interface and API requests.

## Quick-start Guide
1. Clone the repository: `git clone https://github.com/SudeshDahale/AutoScribe.git`
2. Install dependencies: `pip install -r requirements.txt` (backend) and `npm install` (frontend)
3. Start the backend server: `python backend/app/main.py`
4. Start the frontend server: `npm start`
5. Access the application: `http://localhost:3000`

## API Overview
The API provides the following endpoints:
* `GET /api/health`: Health check endpoint
* `POST /api/auth/github_login`: GitHub login endpoint
* `POST /api/auth/github_callback`: GitHub callback endpoint
* `GET /api/repositories`: Repository list endpoint
* `POST /api/repositories`: Repository creation endpoint
* `DELETE /api/repositories/:id`: Repository deletion endpoint
* `GET /api/search`: Search endpoint
* `POST /api/search`: Search query endpoint
* `GET /api/staleness`: Staleness check endpoint
* `POST /api/staleness`: Staleness update endpoint
* `GET /api/webhooks`: Webhook status endpoint
* `POST /api/webhooks`: Webhook configuration endpoint

## Contributing
Contributions are welcome and appreciated. To contribute, please:
1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Submit a pull request with a clear description of your changes
4. Ensure your code is formatted and tested according to the project's standards

## License
AutoScribe is licensed under the [MIT License](https://github.com/SudeshDahale/AutoScribe/blob/main/LICENSE).