-- ==============================================================================
-- BorderGuard AI - Database Initialization Script
-- Target Engine: PostgreSQL 16
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'operator', -- 'admin', 'operator', 'viewer'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CAMERAS TABLE
CREATE TABLE IF NOT EXISTS cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    stream_url VARCHAR(500) NOT NULL,
    stream_type VARCHAR(20) NOT NULL DEFAULT 'rtsp', -- 'rtsp', 'mjpeg', 'mock_video'
    resolution VARCHAR(20) DEFAULT '1920x1080',
    fps INTEGER NOT NULL DEFAULT 25,
    status VARCHAR(20) NOT NULL DEFAULT 'online', -- 'online', 'offline', 'degraded'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ZONES TABLE
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(30) NOT NULL DEFAULT 'restricted', -- 'restricted', 'buffer', 'entry_point'
    polygon_coordinates JSONB NOT NULL, -- [[x1, y1], [x2, y2], ...] normalized [0, 1]
    severity_level VARCHAR(20) NOT NULL DEFAULT 'high', -- 'critical', 'high', 'medium', 'low'
    dwell_time_threshold INTEGER NOT NULL DEFAULT 2, -- seconds before alerting
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DETECTIONS TABLE
CREATE TABLE IF NOT EXISTS detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL,
    class_name VARCHAR(30) NOT NULL,
    confidence FLOAT NOT NULL,
    bounding_box JSONB NOT NULL, -- {x_min, y_min, width, height}
    ground_point JSONB NOT NULL, -- {x_norm, y_norm}
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
    track_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL DEFAULT 'zone_intrusion',
    target_class VARCHAR(30) NOT NULL,
    confidence_score FLOAT NOT NULL,
    bounding_box JSONB NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ALERTS TABLE
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL DEFAULT 'high', -- 'critical', 'high', 'medium', 'low'
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'new', -- 'new', 'acknowledged', 'resolved', 'dismissed'
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ NULL,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ NULL,
    resolution_notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. EVIDENCE TABLE
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(20) NOT NULL DEFAULT 'image_snapshot', -- 'image_snapshot', 'video_clip'
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    sha256_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SYSTEM LOGS TABLE
CREATE TABLE IF NOT EXISTS system_logs (
    id BIGSERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    level VARCHAR(15) NOT NULL,
    message TEXT NOT NULL,
    details JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR LOW-LATENCY REAL-TIME OPERATIONS
CREATE INDEX IF NOT EXISTS idx_alerts_status_severity ON alerts (status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_camera_created ON events (camera_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zones_camera_active ON zones (camera_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_evidence_event_id ON evidence (event_id);
CREATE INDEX IF NOT EXISTS idx_detections_camera_time ON detections (camera_id, timestamp DESC);
