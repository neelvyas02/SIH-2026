# BorderGuard AI: Architecture & System Design Document

## 1. High-Level Vision
BorderGuard AI bridges legacy analog and digital CCTV cameras with cutting-edge edge AI video analytics. Designed for high-stress border outposts and critical infrastructure perimeters, it operates as an active sentinel: continuously processing frames, tracking targets across time, analyzing spatial boundaries, and alerting human operators with sub-second latency.

## 2. Decoupled 2-Tier Modular Monolith
The architecture splits responsibilities cleanly into two cooperative subsystems:
1. **AI Analytics Engine (`ai-engine/`)**: A dedicated Python service housing OpenCV, PyTorch, YOLOv8, ByteTrack, and Shapely. It communicates outbound to the backend via an internal authenticated webhook endpoint (`POST /api/v1/internal/events`).
2. **FastAPI Platform & Real-Time Gateway (`backend/`)**: Handles PostgreSQL relational storage, JWT authentication, camera and zone CRUD, alert lifecycle management, and WebSocket fan-out to connected browser clients.

### Why not pure microservices?
A full microservices setup (gRPC, Kafka, Consul, Docker Swarm) introduces extreme devops friction for a 6-person student team. It creates distributed transaction risks, network partition bugs, and increases failure vectors right before a live jury demo.

### Why not single-process monolith?
Running PyTorch CUDA tensor processing inside the same Python process as FastAPI creates GIL (Global Interpreter Lock) contention. A single uncaught CUDA out-of-memory error or an OpenCV RTSP read freeze would kill the web server, drop all WebSocket connections, and render the dashboard dead.

The 2-tier decoupled architecture provides process-level isolation and fault tolerance while maintaining extreme simplicity.

## 3. Communication Protocols

| Interface | Protocol | Direction | Security & Details |
|---|---|---|---|
| CCTV to AI Engine | RTSP (TCP/UDP) or HLS | Camera -> AI Engine | H.264 video feed, non-blocking frame buffer |
| AI Engine to Backend | HTTP REST (POST) | AI Engine -> Backend | `X-Internal-Secret` HMAC token, JSON payload |
| Frontend to Backend | HTTP REST (JSON) | Frontend <-> Backend | Bearer JWT (HS256), Pydantic validated |
| Backend to Frontend | WebSocket (WSS/WS) | Backend -> Frontend | Real-time push, heartbeat ping/pong, room filter |
| Evidence Storage | Local File System / S3 | Backend -> Disk | SHA-256 hashed JPEGs and MP4 clips |

## 4. Ground-Anchor Zone Intrusion Mathematics
Most computer vision platforms mistakenly use the center-of-mass `( (x1+x2)/2, (y1+y2)/2 )` of the bounding box. When a person walks along a fence, their head or shoulders might tilt forward, prematurely triggering an intrusion alert even though their feet are firmly in authorized territory.

BorderGuard AI anchors containment analysis at the **bottom-center point**:
$$P_{ground} = \left( \frac{x_{min} + x_{max}}{2},\; y_{max} \right)$$
This represents the physical contact point with the terrain (feet for humans, tires for vehicles), eliminating perspective tilt false alarms.
