API Documentation for SudeshDahale/AutoScribe
=============================================

### Authentication

To use the API, you need to obtain a token through the GitHub login process. Here's how to do it:

1. Send a `GET` request to `/api/auth/github_login` to initiate the login process.
2. You will be redirected to the GitHub authorization page. After authorizing, you will be redirected back to the `/api/auth/github_callback` endpoint.
3. The `github_callback` endpoint will return a JSON response with an `access_token` that you can use to authenticate your API requests.

To use the token, include it in the `Authorization` header of your API requests:

```http
Authorization: Bearer <access_token>
```

### Base URL and Versioning

The base URL for the API is `https://api.autoscribe.io/v1`. The API uses versioning to ensure backwards compatibility. The current version is `v1`.

### Endpoints

#### 1. Health Check

* **Method:** `GET`
* **Path:** `/api/health`
* **Description:** Check the health of the API.
* **Path/Query/Body Params:** None
* **Response Shape:**
```json
{
  "status": "ok"
}
```
* **Error Codes:**
	+ 500: Internal Server Error
* **Curl Example:**
```bash
curl -X GET https://api.autoscribe.io/v1/api/health
```

#### 2. Get Current User

* **Method:** `GET`
* **Path:** `/api/user`
* **Description:** Get the current user.
* **Path/Query/Body Params:** None
* **Response Shape:**
```json
{
  "id": 1,
  "username": "johnDoe"
}
```
* **Error Codes:**
	+ 401: Unauthorized
	+ 500: Internal Server Error
* **Curl Example:**
```bash
curl -X GET -H "Authorization: Bearer <access_token>" https://api.autoscribe.io/v1/api/user
```

#### 3. Parse Repository

* **Method:** `POST`
* **Path:** `/api/repositories/parse`
* **Description:** Parse a repository.
* **Path/Query/Body Params:**
	+ `owner`: The owner of the repository.
	+ `repo`: The name of the repository.
* **Response Shape:**
```json
{
  "id": 1,
  "owner": "johnDoe",
  "repo": "myRepo"
}
```
* **Error Codes:**
	+ 401: Unauthorized
	+ 404: Repository not found
	+ 500: Internal Server Error
* **Curl Example:**
```bash
curl -X POST -H "Authorization: Bearer <access_token>" -H "Content-Type: application/json" -d '{"owner": "johnDoe", "repo": "myRepo"}' https://api.autoscribe.io/v1/api/repositories/parse
```

#### 4. Get Repository Readme

* **Method:** `GET`
* **Path:** `/api/repositories/{owner}/{repo}/readme`
* **Description:** Get the README of a repository.
* **Path/Query/Body Params:**
	+ `owner`: The owner of the repository.
	+ `repo`: The name of the repository.
* **Response Shape:**
```json
{
  "content": "This is the README of my repository."
}
```
* **Error Codes:**
	+ 401: Unauthorized
	+ 404: Repository not found
	+ 500: Internal Server Error
* **Curl Example:**
```bash
curl -X GET -H "Authorization: Bearer <access_token>" https://api.autoscribe.io/v1/api/repositories/johnDoe/myRepo/readme
```

#### 5. Search Repository

* **Method:** `POST`
* **Path:** `/api/repositories/{owner}/{repo}/search`
* **Description:** Search a repository.
* **Path/Query/Body Params:**
	+ `owner`: The owner of the repository.
	+ `repo`: The name of the repository.
	+ `query`: The search query.
* **Response Shape:**
```json
{
  "results": [
    {
      "file": "file1.txt",
      "content": "This is the content of file1.txt."
    }
  ]
}
```
* **Error Codes:**
	+ 401: Unauthorized
	+ 404: Repository not found
	+ 500: Internal Server Error
* **Curl Example:**
```bash
curl -X POST -H "Authorization: Bearer <access_token>" -H "Content-Type: application/json" -d '{"query": "search query"}' https://api.autoscribe.io/v1/api/repositories/johnDoe/myRepo/search
```

#### 6. Get Repository Analytics

* **Method:** `GET`
* **Path:** `/api/repositories/{owner}/{repo}/analytics`
* **Description:** Get the analytics of a repository.
* **Path/Query/Body Params:**
	+ `owner`: The owner of the repository.
	+ `repo`: The name of the repository.
* **Response Shape:**
```json
{
  "stars": 100,
  "forks": 50
}
```
* **Error Codes:**
	+ 401: Unauthorized
	+ 404: Repository not found
	+ 500: Internal Server Error
* **Curl Example:**
```bash
curl -X GET -H "Authorization: Bearer <access_token>" https://api.autoscribe.io/v1/api/repositories/johnDoe/myRepo/analytics
```

#### 7. Trigger Background Update

* **Method:** `POST`
* **Path:** `/api/repositories/{owner}/{repo}/update`
* **Description:** Trigger a background update of a repository.
* **Path/Query/Body Params:**
	+ `owner`: The owner of the repository.
	+ `repo`: The name of the repository.
* **Response Shape:**
```json
{
  "message": "Update triggered successfully."
}
```
* **Error Codes:**
	+ 401: Unauthorized
	+ 404: Repository not found
	+ 500: Internal Server Error
* **Curl Example:**
```bash
curl -X POST -H "Authorization: Bearer <access_token>" https://api.autoscribe.io/v1/api/repositories/johnDoe/myRepo/update
```

### Rate-Limiting and Pagination

The API uses rate-limiting to prevent abuse. The rate limit is 100 requests per hour per IP address. If you exceed the rate limit, you will receive a 429 response with a `Retry-After` header indicating when you can make another request.

The API uses pagination to limit the amount of data returned in a single response. The default page size is 10. You can specify a custom page size using the `page_size` query parameter. The API will return a `next` link in the response if there are more results available.

Example:
```http
GET /api/repositories?page_size=20
```
Response:
```json
{
  "results": [
    {
      "id": 1,
      "owner": "johnDoe",
      "repo": "myRepo"
    }
  ],
  "next": "https://api.autoscribe.io/v1/api/repositories?page=2&page_size=20"
}
```