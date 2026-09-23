-- ==============================================================================
-- BorderGuard AI - Realistic Seed Data for Hackathon Demonstration
-- ==============================================================================

-- 1. Default Admin & Operator Users
-- Password for all accounts: "admin123" (bcrypt hash: $2b$12$e868d4f40f09b55225fae.G/kX9H2w7dCq0V66J36K.qj/b9q8Z3G or argon2)
INSERT INTO users (id, username, email, hashed_password, full_name, role, is_active)
VALUES
    ('c39a04f2-9c97-44fa-8b27-c1ff72d9b628', 'admin', 'admin@borderguard.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Inspector V. Sharma', 'admin', TRUE),
    ('d48b15e3-8d86-43eb-9a16-b2ee81e8c719', 'operator1', 'operator1@borderguard.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Sub-Inspector R. Verma', 'operator', TRUE),
    ('e57c26f4-7e75-42da-8905-a3dd92f7d80a', 'operator2', 'operator2@borderguard.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Head Constable D. Patel', 'operator', TRUE),
    ('f68d37a5-8f86-53eb-9b27-c2ee92e9d91b', 'commander', 'commander@borderguard.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Sector Commander D. Kaur', 'commander', TRUE),
    ('a79e48b6-9a97-64fc-ac38-d3ff03faea2c', 'investigator', 'investigator@borderguard.gov.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Special Agent S. Menon', 'investigator', TRUE)
ON CONFLICT (username) DO NOTHING;

-- 2. Surveillance Cameras
INSERT INTO cameras (id, name, location, stream_url, stream_type, resolution, fps, status, is_active)
VALUES
    ('b1a23e54-7890-4c12-a345-6789abcdef01', 'Watchtower 04 - Zero Line', 'Sector 7B (Barbed Wire North)', 'rtsp://localhost:8554/live/border1', 'rtsp', '1920x1080', 25, 'online', TRUE),
    ('b2b34f65-8901-5d23-b456-7890bcdef012', 'Culvert 12 - Creek Patrol', 'Sector 8A (Riverine Gap)', 'rtsp://localhost:8554/live/border2', 'rtsp', '1920x1080', 25, 'online', TRUE),
    ('b3c45a76-9012-6e34-c567-8901cdef0123', 'Post Echo - Forward Trench', 'Sector 4C (Dense Foliage)', 'rtsp://localhost:8554/live/border3', 'rtsp', '1280x720', 20, 'online', TRUE),
    ('b4d56b87-0123-7f45-d678-9012def01234', 'Supply Gate Charlie', 'Rear Base Logistics Road', 'rtsp://localhost:8554/live/border4', 'rtsp', '1920x1080', 25, 'online', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Preconfigured Restricted Polygon Zones (Normalized [0, 1] Coordinates)
INSERT INTO zones (id, camera_id, name, zone_type, polygon_coordinates, severity_level, dwell_time_threshold, is_active)
VALUES
    (
        '9f8e7d6c-5b4a-3210-fedc-ba9876543210',
        'b1a23e54-7890-4c12-a345-6789abcdef01',
        'Zero-Line Barbed Wire Buffer',
        'restricted',
        '[[0.15, 0.40], [0.88, 0.38], [0.95, 0.88], [0.08, 0.92]]'::jsonb,
        'critical',
        2,
        TRUE
    ),
    (
        '8e7d6c5b-4a3b-210f-edcb-a98765432109',
        'b1a23e54-7890-4c12-a345-6789abcdef01',
        'Post 4 Vehicle Approach Road',
        'buffer',
        '[[0.02, 0.65], [0.35, 0.60], [0.45, 0.98], [0.01, 0.98]]'::jsonb,
        'high',
        3,
        TRUE
    ),
    (
        '7d6c5b4a-3b2a-10fe-dcba-987654321098',
        'b2b34f65-8901-5d23-b456-7890bcdef012',
        'Riverine Crossing Point Alpha',
        'restricted',
        '[[0.20, 0.30], [0.80, 0.30], [0.85, 0.75], [0.15, 0.75]]'::jsonb,
        'critical',
        1,
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

-- 4. Initial Realistic Incident Events
INSERT INTO events (id, camera_id, zone_id, track_id, event_type, target_class, confidence_score, bounding_box, start_time, end_time)
VALUES
    (
        '550e8400-e29b-41d4-a716-446655440000',
        'b1a23e54-7890-4c12-a345-6789abcdef01',
        '9f8e7d6c-5b4a-3210-fedc-ba9876543210',
        104,
        'zone_intrusion',
        'person',
        0.89,
        '{"x_min": 510, "y_min": 340, "width": 80, "height": 185}'::jsonb,
        NOW() - INTERVAL '15 minutes',
        NULL
    ),
    (
        '660e8400-e29b-41d4-a716-446655440001',
        'b1a23e54-7890-4c12-a345-6789abcdef01',
        '8e7d6c5b-4a3b-210f-edcb-a98765432109',
        112,
        'loitering',
        'vehicle',
        0.94,
        '{"x_min": 120, "y_min": 580, "width": 240, "height": 140}'::jsonb,
        NOW() - INTERVAL '45 minutes',
        NOW() - INTERVAL '40 minutes'
    )
ON CONFLICT (id) DO NOTHING;

-- 5. Actionable Alerts
INSERT INTO alerts (id, event_id, camera_id, severity, title, description, status, acknowledged_by, acknowledged_at, resolved_by, resolved_at, resolution_notes, created_at)
VALUES
    (
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '550e8400-e29b-41d4-a716-446655440000',
        'b1a23e54-7890-4c12-a345-6789abcdef01',
        'critical',
        'CRITICAL INTRUSION: Zero-Line Barbed Wire Buffer',
        'Person breached restricted boundary at Sector 7B. Dwell duration: 3.2s. Tracking ID #104 actively logged.',
        'new',
        NULL, NULL, NULL, NULL, NULL,
        NOW() - INTERVAL '15 minutes'
    ),
    (
        '7ba7b810-9dad-11d1-80b4-00c04fd430c9',
        '660e8400-e29b-41d4-a716-446655440001',
        'b1a23e54-7890-4c12-a345-6789abcdef01',
        'high',
        'HIGH WARNING: Vehicle Loitering on Approach Road',
        'Unregistered light transport vehicle idling in proximity to Post 4 logistics route for over 5 minutes.',
        'resolved',
        'd48b15e3-8d86-43eb-9a16-b2ee81e8c719',
        NOW() - INTERVAL '42 minutes',
        'c39a04f2-9c97-44fa-8b27-c1ff72d9b628',
        NOW() - INTERVAL '38 minutes',
        'Authorized water supply bowser verified by Post 4 sentry. Log closed.',
        NOW() - INTERVAL '45 minutes'
    )
ON CONFLICT (id) DO NOTHING;

-- 6. Forensic Evidence Records
INSERT INTO evidence (id, event_id, file_path, file_type, file_size_bytes, sha256_hash, created_at)
VALUES
    (
        '770e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440000',
        'snapshots/sample_evidence_104.jpg',
        'image_snapshot',
        148200,
        'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        NOW() - INTERVAL '15 minutes'
    )
ON CONFLICT (id) DO NOTHING;
