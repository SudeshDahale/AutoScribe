API Documentation for SudeshDahale/AutoScribe
==============================================

### Authentication

To use the AutoScribe API, you need to obtain a token through the GitHub login process. Here's how to do it:

1. Send a `GET` request to `/api/auth/github_login` to redirect to the GitHub authorization page.
2. After authorizing, GitHub will redirect to `/api/auth/github_callback` with a code.
3. The server will then exchange the code for an access token and return it in the response.

You can use this token to authenticate your requests by including it in the `Authorization` header with the `Bearer` scheme.

### Base URL and Versioning

The base URL for the AutoScribe API is `https://api.autoscribe.io/v1`. All endpoints are versioned using the `v1` prefix.

### Endpoints

#### 1. Health Check

* **Method:** `GET`
* **Path:** `/api/health`
* **Description:** Check the health of the API.
* **Path/Query/Body Params:** None
* **Response Shape:**
	+ `200 OK`: `{ "status": "healthy" }`
* **Error Codes:**
	+ `500 Internal Server Error`: API is unhealthy
* **Curl Example:**
```bash
curl -X GET https://api.autoscribe.io/v1/api/health
```

#### 2. List Repositories

* **Method:** `GET`
* **Path:** `/api/repositories`
* **Description:** List all repositories for the authenticated user.
* **Path/Query/Body Params:**
	+ `page` (query): Page number for pagination (default: 1)
	+ `per_page` (query): Number of repositories per page (default: 10)
* **Response Shape:**
	+ `200 OK`: `[ { "id": 1, "name": "repo1", "owner": "user1" }, ... ]`
* **Error Codes:**
	+ `401 Unauthorized`: Authentication failed
	+ `500 Internal Server Error`: API error
* **Curl Example:**
```bash
curl -X GET \
  https://api.autoscribe.io/v1/api/repositories \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

#### 3. Add Repository

* **Method:** `POST`
* **Path:** `/api/repositories`
* **Description:** Add a new repository for the authenticated user.
* **Path/Query/Body Params:**
	+ `owner` (body): Repository owner
	+ `name` (body): Repository name
* **Response Shape:**
	+ `201 Created`: `{ "id": 1, "name": "repo1", "owner": "user1" }`
* **Error Codes:**
	+ `401 Unauthorized`: Authentication failed
	+ `400 Bad Request`: Invalid request body
	+ `500 Internal Server Error`: API error
* **Curl Example:**
```bash
curl -X POST \
  https://api.autoscribe.io/v1/api/repositories \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"owner": "user1", "name": "repo1"}'
```

#### 4. Delete Repository

* **Method:** `DELETE`
* **Path:** `/api/repositories/{id}`
* **Description:** Delete a repository for the authenticated user.
* **Path/Query/Body Params:**
	+ `id` (path): Repository ID
* **Response Shape:**
	+ `204 No Content`: None
* **Error Codes:**
	+ `401 Unauthorized`: Authentication failed
	+ `404 Not Found`: Repository not found
	+ `500 Internal Server Error`: API error
* **Curl Example:**
```bash
curl -X DELETE \
  https://api.autoscribe.io/v1/api/repositories/1 \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

#### 5. Search Repository

* **Method:** `POST`
* **Path:** `/api/search`
* **Description:** Search a repository for the authenticated user.
* **Path/Query/Body Params:**
	+ `repository_id` (body): Repository ID
	+ `query` (body): Search query
* **Response Shape:**
	+ `200 OK`: `[ { "id": 1, "name": "file1", "content": "..." }, ... ]`
* **Error Codes:**
	+ `401 Unauthorized`: Authentication failed
	+ `400 Bad Request`: Invalid request body
	+ `500 Internal Server Error`: API error
* **Curl Example:**
```bash
curl -X POST \
  https://api.autoscribe.io/v1/api/search \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"repository_id": 1, "query": "search query"}'
```

#### 6. Get Repository Readme

* **Method:** `GET`
* **Path:** `/api/repositories/{id}/readme`
* **Description:** Get the README file for a repository.
* **Path/Query/Body Params:**
	+ `id` (path): Repository ID
* **Response Shape:**
	+ `200 OK`: `{ "content": "..." }`
* **Error Codes:**
	+ `401 Unauthorized`: Authentication failed
	+ `404 Not Found`: Repository not found
	+ `500 Internal Server Error`: API error
* **Curl Example:**
```bash
curl -X GET \
  https://api.autoscribe.io/v1/api/repositories/1/readme \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

#### 7. Get Repository Analytics

* **Method:** `GET`
* **Path:** `/api/repositories/{id}/analytics`
* **Description:** Get analytics for a repository.
* **Path/Query/Body Params:**
	+ `id` (path): Repository ID
* **Response Shape:**
	+ `200 OK`: `{ "stats": { ... } }`
* **Error Codes:**
	+ `401 Unauthorized`: Authentication failed
	+ `404 Not Found`: Repository not found
	+ `500 Internal Server Error`: API error
* **Curl Example:**
```bash
curl -X GET \
  https://api.autoscribe.io/v1/api/repositories/1/analytics \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### Rate-Limiting and Pagination

* The API has a rate limit of 100 requests per hour per IP address.
* For endpoints that return a list of items, pagination is used to limit the number of items returned.
* The `page` and `per_page` query parameters can be used to control pagination.
* The `Link` header is used to provide pagination links.

Note: This documentation is based on the provided codebase and may not be comprehensive or up-to-date. It is recommended to review the code and test the API to ensure accuracy and completeness.