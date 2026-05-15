# Onboarding Guide for SudeshDahale/AutoScribe
## 1. Project Purpose and Team Context
AutoScribe is a project aimed at automating the process of generating documentation for GitHub repositories. The team behind AutoScribe consists of developers and technical writers working together to create a tool that simplifies the documentation process, making it easier for developers to maintain and update their repository documentation.

## 2. Prerequisites and Local Setup
To set up AutoScribe locally, follow these steps:
### Step 1: Install Required Packages
* Install Python 3.9 or higher
* Install pip and virtualenv
* Create a new virtual environment: `virtualenv autoscribe-env`
* Activate the virtual environment: `source autoscribe-env/bin/activate` (on Linux/Mac) or `autoscribe-env\Scripts\activate` (on Windows)
* Install required packages: `pip install -r backend/requirements.txt`

### Step 2: Clone the Repository
* Clone the AutoScribe repository: `git clone https://github.com/SudeshDahale/AutoScribe.git`

### Step 3: Set up the Database
* Create a new database for AutoScribe (e.g., using PostgreSQL)
* Update the `backend/app/core/config.py` file with your database credentials

### Step 4: Run Migrations
* Run the database migrations: `python backend/migrations/add_staleness_tables.py`

### Step 5: Start the Application
* Start the application: `python backend/app/main.py`

## 3. Codebase Tour: Where to Find Things
The AutoScribe codebase is organized into several directories:
* `backend`: contains the server-side code
	+ `app`: contains the application logic
		- `api`: contains the API endpoints
		- `core`: contains the core functionality
		- `models`: contains the database models
	+ `migrations`: contains the database migrations
	+ `test`: contains the tests
* `frontend`: contains the client-side code

## 4. Key Concepts and Domain Vocabulary
* **Repository**: a GitHub repository
* **Documentation**: the generated documentation for a repository
* **Staleness**: the state of a repository's documentation being out of date
* **Incremental update**: the process of updating a repository's documentation incrementally
* **Webhook**: a GitHub webhook that triggers an update of a repository's documentation

## 5. First Tasks / Good-First-Issues
* Implement a new API endpoint to retrieve a repository's documentation
* Fix a bug in the staleness detection algorithm
* Improve the performance of the incremental update process

## 6. Code Review Norms and PR Process
* All code changes must be reviewed by at least one other team member
* Code reviews should check for correctness, readability, and adherence to coding standards
* PRs should include a clear description of the changes made and any relevant context
* PRs should be reviewed and merged within 24 hours

## 7. Useful Commands and Scripts
* `python backend/app/main.py`: starts the application
* `python backend/migrations/add_staleness_tables.py`: runs the database migrations
* `pip install -r backend/requirements.txt`: installs the required packages
* `git clone https://github.com/SudeshDahale/AutoScribe.git`: clones the repository
* `source autoscribe-env/bin/activate` (on Linux/Mac) or `autoscribe-env\Scripts\activate` (on Windows): activates the virtual environment