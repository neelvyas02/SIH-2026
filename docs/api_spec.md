# BorderGuard AI: REST & WebSocket API Specification

Base URL: `http://localhost:8000/api/v1`

## Authentication (`/auth`)

### 1. `POST /auth/login`
- **Description**: Authenticate operator credentials and receive JWT access token.
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 28800,
    "user": {
      "id": "c39a04f2-9c97-44fa-8b27-c1ff72d9b628",
      "username": "admin",
      "full_name": "Inspector V. Sharma",
      "role": "admin"
    }
  }
  ```

### 2. `GET /auth/me`
- **Header**: `Authorization: Bearer <token>`
- **Response `200 OK`**: Current user details.

---

## Cameras (`/cameras`)

### 1. `GET /cameras`
- **Response `200 OK`**: List of all CCTV cameras with active status and zone counts.

### 2. `POST /cameras`
- **Header**: `Authorization: Bearer <token>` (Admin only)
- **Request Body**:
  ```json
  {
    "name": "Tower 4 - North Perimeter",
    "location": "Sector 7B",
    "stream_url": "rtsp://localhost:8554/live/border1",
    "stream_type": "rtsp",
    "fps": 25
  }
  ```

### 3. `GET /cameras/{id}`
- **Response `200 OK`**: Detailed camera metadata, configured zones, and recent events.

---

## Zones (`/cameras/{camera_id}/zones`)

### 1. `GET /cameras/{camera_id}/zones`
- **Response `200 OK`**: All active polygon boundaries for this camera.

### 2. `POST /cameras/{camera_id}/zones`
- **Request Body**:
  ```json
  {
    "name": "Barbed Wire Line",
    "zone_type": "restricted",
    "severity_level": "critical",
    "dwell_time_threshold": 2,
    "polygon_coordinates": [
      [0.10, 0.40],
      [0.90, 0.40],
      [0.95, 0.90],
      [0.05, 0.90]
    ]
  }
  ```

---

## Alerts (`/alerts`)

### 1. `GET /alerts`
- **Query Params**: `status` (`new`, `acknowledged`, `resolved`), `severity`, `limit`, `offset`.
- **Response `200 OK`**: Actionable alert queue sorted by severity and timestamp.

### 2. `POST /alerts/{id}/acknowledge`
- **Response `200 OK`**: Marks alert as acknowledged by current operator.

### 3. `POST /alerts/{id}/resolve`
- **Request Body**:
  ```json
  {
    "resolution_notes": "Patrol dispatched. False alarm triggered by wild boar."
  }
  ```

---

## Internal AI Ingestion (`/internal`)

### 1. `POST /internal/events`
- **Header**: `X-Internal-Secret: <SECRET_KEY>`
- **Request Body**:
  ```json
  {
    "event_type": "zone_intrusion",
    "camera_id": "b1a23e54-7890-4c12-a345-6789abcdef01",
    "zone_id": "9f8e7d6c-5b4a-3210-fedc-ba9876543210",
    "track_id": 104,
    "target_class": "person",
    "confidence_score": 0.89,
    "bounding_box": { "x_min": 510, "y_min": 340, "width": 80, "height": 185 },
    "ground_point": { "x_norm": 0.49, "y_norm": 0.51 },
    "dwell_duration_seconds": 2.2,
    "timestamp": "2026-09-20T22:30:00Z",
    "evidence": {
      "snapshot_filename": "ev_104.jpg",
      "relative_path": "snapshots/ev_104.jpg",
      "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    }
  }
  ```

---

## WebSockets (`/ws/alerts`)

- **URL**: `ws://localhost:8000/api/v1/ws/alerts?token=<JWT_TOKEN>`
- **Behavior**: Subscribes operator client to broadcast security channel.
- **Server Push Message (JSON)**:
  ```json
  {
    "type": "NEW_ALERT",
    "data": {
      "alert_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "severity": "critical",
      "title": "CRITICAL INTRUSION: Zero-Line Barbed Wire Buffer",
      "camera_name": "Watchtower 04 - Zero Line",
      "target_class": "person",
      "timestamp": "2026-09-20T22:30:00Z",
      "thumbnail_url": "/static/evidence/snapshots/ev_104.jpg"
    }
  }
  ```
