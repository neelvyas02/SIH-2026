const API_BASE = '/api/v1';

// Token helper
export const getAuthToken = () => localStorage.getItem('borderguard_token');
export const setAuthToken = (token) => localStorage.setItem('borderguard_token', token);
export const clearAuthToken = () => localStorage.removeItem('borderguard_token');

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      clearAuthToken();
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) return null;
    return await response.json();
  } catch (err) {
    console.warn(`API request to ${endpoint} failed:`, err.message);
    throw err;
  }
}

// Fallback Mock Data for standalone demonstration
const MOCK_CAMERAS = [
  {
    id: "b1a23e54-7890-4c12-a345-6789abcdef01",
    name: "Watchtower 04 - Zero Line",
    location: "Sector 7B (Barbed Wire North)",
    stream_url: "rtsp://localhost:8554/live/border1",
    stream_type: "rtsp",
    resolution: "1920x1080",
    fps: 25,
    status: "online",
    is_active: true,
    zone_count: 2,
  },
  {
    id: "b2b34f65-8901-5d23-b456-7890bcdef012",
    name: "Culvert 12 - Creek Patrol",
    location: "Sector 8A (Riverine Gap)",
    stream_url: "rtsp://localhost:8554/live/border2",
    stream_type: "rtsp",
    resolution: "1920x1080",
    fps: 25,
    status: "online",
    is_active: true,
    zone_count: 1,
  },
  {
    id: "b3c45a76-9012-6e34-c567-8901cdef0123",
    name: "Post Echo - Forward Trench",
    location: "Sector 4C (Dense Foliage)",
    stream_url: "rtsp://localhost:8554/live/border3",
    stream_type: "rtsp",
    resolution: "1280x720",
    fps: 20,
    status: "online",
    is_active: true,
    zone_count: 0,
  },
  {
    id: "b4d56b87-0123-7f45-d678-9012def01234",
    name: "Supply Gate Charlie",
    location: "Rear Base Logistics Road",
    stream_url: "rtsp://localhost:8554/live/border4",
    stream_type: "rtsp",
    resolution: "1920x1080",
    fps: 25,
    status: "online",
    is_active: true,
    zone_count: 1,
  },
];

const MOCK_ALERTS = [
  {
    id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    event_id: "550e8400-e29b-41d4-a716-446655440000",
    camera_id: "b1a23e54-7890-4c12-a345-6789abcdef01",
    camera_name: "Watchtower 04 - Zero Line",
    severity: "critical",
    title: "CRITICAL INTRUSION: Zero-Line Barbed Wire Buffer",
    description: "Person breached restricted boundary at Sector 7B. Dwell duration: 3.2s. Tracking ID #104 actively logged.",
    status: "new",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    thumbnail_url: "/static/evidence/snapshots/sample_evidence_104.jpg"
  },
  {
    id: "7ba7b810-9dad-11d1-80b4-00c04fd430c9",
    event_id: "660e8400-e29b-41d4-a716-446655440001",
    camera_id: "b1a23e54-7890-4c12-a345-6789abcdef01",
    camera_name: "Watchtower 04 - Zero Line",
    severity: "high",
    title: "HIGH WARNING: Vehicle Loitering on Approach Road",
    description: "Unregistered transport vehicle idling in proximity to Post 4 logistics route for over 5 minutes.",
    status: "resolved",
    acknowledged_by_name: "Sub-Inspector R. Verma",
    resolved_by_name: "Inspector V. Sharma (Lead)",
    resolution_notes: "Authorized water bowser confirmed by sentry. Log closed.",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    thumbnail_url: "/static/evidence/snapshots/sample_evidence_104.jpg"
  }
];

export const api = {
  // Auth
  login: async (username, password) => {
    try {
      return await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
    } catch {
      // Offline fallback login for demonstration
      const demoToken = "demo-jwt-token-borderguard-sih";
      setAuthToken(demoToken);
      return {
        access_token: demoToken,
        token_type: "bearer",
        user: {
          id: "demo-user-1",
          username: username || "admin",
          full_name: "Inspector V. Sharma (Lead)",
          role: "admin"
        }
      };
    }
  },

  getCurrentUser: async () => {
    try {
      return await request('/auth/me');
    } catch {
      return {
        id: "demo-user-1",
        username: "admin",
        full_name: "Inspector V. Sharma (Lead)",
        role: "admin"
      };
    }
  },

  // Cameras
  getCameras: async () => {
    try {
      return await request('/cameras');
    } catch {
      return MOCK_CAMERAS;
    }
  },

  getCamera: async (id) => {
    try {
      return await request(`/cameras/${id}`);
    } catch {
      return MOCK_CAMERAS.find(c => c.id === id) || MOCK_CAMERAS[0];
    }
  },

  createCamera: async (data) => {
    return await request('/cameras', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Zones
  getZones: async (cameraId) => {
    try {
      return await request(`/cameras/${cameraId}/zones`);
    } catch {
      return [
        {
          id: "9f8e7d6c-5b4a-3210-fedc-ba9876543210",
          camera_id: cameraId,
          name: "Zero-Line Barbed Wire Buffer",
          zone_type: "restricted",
          severity_level: "critical",
          dwell_time_threshold: 2,
          polygon_coordinates: [[0.15, 0.40], [0.88, 0.38], [0.95, 0.88], [0.08, 0.92]],
          is_active: true
        }
      ];
    }
  },

  createZone: async (cameraId, data) => {
    try {
      return await request(`/cameras/${cameraId}/zones`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return { id: `mock-${Date.now()}`, camera_id: cameraId, ...data };
    }
  },

  deleteZone: async (zoneId) => {
    return await request(`/zones/${zoneId}`, { method: 'DELETE' });
  },

  // Alerts
  getAlerts: async (params = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      return await request(`/alerts?${query}`);
    } catch {
      return MOCK_ALERTS;
    }
  },

  acknowledgeAlert: async (id, notes = "") => {
    try {
      return await request(`/alerts/${id}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
    } catch {
      return { id, status: "acknowledged", acknowledged_by_name: "Inspector V. Sharma" };
    }
  },

  resolveAlert: async (id, resolution_notes) => {
    try {
      return await request(`/alerts/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution_notes }),
      });
    } catch {
      return { id, status: "resolved", resolution_notes, resolved_by_name: "Inspector V. Sharma" };
    }
  },

  // Events
  getEvents: async () => {
    try {
      return await request('/events');
    } catch {
      return [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          camera_id: "b1a23e54-7890-4c12-a345-6789abcdef01",
          camera_name: "Watchtower 04 - Zero Line",
          zone_name: "Zero-Line Barbed Wire Buffer",
          track_id: 104,
          event_type: "zone_intrusion",
          target_class: "person",
          confidence_score: 0.89,
          start_time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          bounding_box: { x_min: 510, y_min: 340, width: 80, height: 185 }
        }
      ];
    }
  },

  // Stats
  getStats: async () => {
    try {
      return await request('/stats/summary');
    } catch {
      return {
        active_cameras_count: 4,
        total_cameras_count: 4,
        unacknowledged_alerts: 1,
        critical_alerts_today: 3,
        resolved_today: 8,
        system_uptime_seconds: 86400,
        severity_breakdown: { critical: 3, high: 2, medium: 1, low: 0 },
        hourly_trends: [
          { hour: "17:00", count: 1 },
          { hour: "18:00", count: 3 },
          { hour: "19:00", count: 0 },
          { hour: "20:00", count: 4 },
          { hour: "21:00", count: 2 },
          { hour: "22:00", count: 5 }
        ]
      };
    }
  }
};
