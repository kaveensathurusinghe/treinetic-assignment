## Task Manager App – Full Stack Assignment

This repository contains a full‑stack Task Manager application implemented as a coding assignment. It includes a Spring Boot backend, an Angular frontend, and a MySQL database, all wired together with Docker Compose so the whole project can be started with a single command.

---

### 1. Features

- **User authentication**
	- User registration with validation (unique username and email).
	- Login with username/password.
	- Passwords stored using BCrypt hashing.
	- JWT‑based authentication for protected APIs.

- **Task management**
	- Create, read, update, and delete tasks for the logged‑in user.
	- Each task has: `title`, `description`, `status`, and `dueDate`.
	- Tasks are always scoped to the authenticated user.
	- Server‑side validation for required fields and length constraints.

- **Task views & UX (frontend)**
	- Login and registration screens.
	- Task list for the current user.
	- Forms for creating and editing tasks.
	- Status display (e.g. TODO / IN_PROGRESS / DONE).

- **Security & API**
	- Endpoints under `/api/auth/**` are public (login/register).
	- Task endpoints under `/api/tasks/**` require a valid JWT.
	- CORS configured to allow both the Angular dev server and the Dockerized frontend.

---

### 2. Tech Stack

- **Backend**
	- Java 17
	- Spring Boot (Web, Data JPA, Security, Validation)
	- MySQL 8
	- Maven

- **Frontend**
	- Angular 21
	- TypeScript
	- SCSS/CSS and Bootstrap for styling

- **Infrastructure / Tooling**
	- Docker & Docker Compose
	- Nginx (serving the built Angular app)

---

### 3. How to Run (Docker – Recommended)

**Prerequisites**

- Docker and Docker Compose installed.
- Ports **80**, **8080**, and **3307** are free on your machine.

**1) Configure environment variables**

From the project root, create your own `.env` file:

```bash
cp .env.example .env
```

Then edit `.env` and set **secure values** for:

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `JWT_SECRET`

> Note: The real secrets are **not** committed to the repo; each developer sets their own values locally.

**2) Single command startup**

From the project root:

```bash
docker compose up --build
```

This will:

- Start **MySQL** on `localhost:3307` inside a `taskmanager-mysql` container.
- Build and start the **Spring Boot backend** on `localhost:8080`.
- Build the **Angular frontend**, then serve it via **nginx** on `http://localhost`.

**Accessing the app**

- Frontend (UI): `http://localhost`
- Backend API (for reference): `http://localhost:8080/api`

To stop the stack:

```bash
docker compose down
```

The MySQL data is persisted in the `mysql-data` Docker volume so container restarts do not wipe the database.

---

### 4. Running Locally Without Docker (Optional)

You can also run the backend and frontend separately for development.

**Backend (Spring Boot)**

1. Ensure you have Java 17 and Maven installed.
2. Configure a local MySQL instance (or update `application-dev.properties`).
3. From the `backend` directory, run:

	 ```bash
	 ./mvnw spring-boot:run
	 ```

	 The backend will start on `http://localhost:8080`.

**Frontend (Angular)**

1. From the `frontend` directory, install dependencies:

	 ```bash
	 npm install
	 ```

2. Start the dev server:

	 ```bash
	 ng serve
	 ```

3. Open `http://localhost:4200` in your browser.

For local dev, CORS is configured to accept `http://localhost:4200` for API calls.

---

### 5. API Overview

**Auth endpoints** (`/api/auth`)

- `POST /api/auth/register` – Register a new user.
- `POST /api/auth/login` – Authenticate and receive a JWT token.
- `GET /api/auth/me` – Get the current user profile (requires JWT).

**Task endpoints** (`/api/tasks` – JWT required)

- `GET /api/tasks` – List tasks for the current user (optionally filtered by status).
- `GET /api/tasks/{id}` – Get a single task by id.
- `POST /api/tasks` – Create a new task.
- `PUT /api/tasks/{id}` – Update an existing task.
- `DELETE /api/tasks/{id}` – Delete a task.

All protected endpoints expect an `Authorization: Bearer <token>` header with the JWT returned by the login endpoint.

---

### 6. Architecture & Folder Structure

- **Backend** – `backend/`
	- `config/` – Spring Security and application configuration.
	- `controller/` – REST controllers (`AuthController`, `TaskController`).
	- `dto/` – Data transfer objects for requests/responses.
	- `model/` – JPA entities (`User`, `Task`, `TaskStatus`, etc.).
	- `repository/` – Spring Data JPA repositories.
	- `security/` – JWT utilities, filters, and user details service.
	- `service/` – Business logic for authentication and tasks.

- **Frontend** – `frontend/`
	- `src/app/core/` – Auth guard, interceptors, and core services.
	- `src/app/features/auth/` – Login and register components.
	- `src/app/features/tasks/` – Task list, details, and form components.
	- `src/app/shared/` – Reusable shared components (dialogs, loaders, etc.).
	- `src/environments/environment.docker.ts` – API base URL for Docker build.

---

### 7. Notes & Assumptions

- The application is intended as an assignment, so the focus is on clean structure, clear separation of concerns, and a simple Dockerized developer experience.
- Default configuration values (DB credentials, JWT secret) are set in `docker-compose.yml` for ease of setup and can be overridden with environment variables if needed.
- CORS is explicitly configured to work both with the Angular dev server (`http://localhost:4200`) and the Dockerized frontend (`http://localhost`).

---

### 8. How to Evaluate

- Clone the repository.
- Setup the local variables(look at the example.env).
- Run:

	```bash
	docker compose up --build
	```

- Open `http://localhost` and:
	- Register a new user.
	- Log in and manage tasks (create, update, delete, filter by status).

No manual configuration should be required beyond having Docker installed.