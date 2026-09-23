# BorderGuard AI: SIH Jury Presentation & Demo Script
**Duration**: 5 Minutes
**Target Audience**: Ministry Evaluators, Senior Defence Scientists, and Technical Judges

---

## 🕒 Minute-by-Minute Pitch Timeline

### [00:00 - 01:00] The Problem Statement & Core Value Proposition
- **Speaker (Vivek - Team Lead)**:
  - *"Good morning respected judges. India has over 15,000 km of land borders. Thousands of CCTV cameras are already deployed at border outposts, culverts, and fences. However, monitoring dozens of screens simultaneously causes severe cognitive fatigue for border security personnel. Studies show that after 20 minutes of continuous monitoring, an operator misses up to 90% of subtle activity."*
  - *"Replacing all existing cameras with proprietary thermal sensors is cost-prohibitive. Today, we introduce **BorderGuard AI**: an intelligent video analytics layer that plugs directly into existing legacy CCTV feeds, turning dumb cameras into intelligent perimeter sentinels without replacing a single piece of camera hardware."*

### [01:00 - 02:30] Live System Walkthrough: SOC Command Dashboard
- **Speaker (Earm / Shubham - Frontend)**:
  - *"Here is the BorderGuard AI command center, designed strictly around military Dark Mode specifications to prevent operator eye fatigue during 12-hour shifts."*
  - Show the **Dashboard**: Point to the live matrix grid showing feeds from different border sectors (Sector 7B, Riverine Gap, Supply Gate).
  - Point to the **Telemetry Bar**: *"Notice our system metrics—FPS, latency, active cameras, and zero-loss WebSocket connectivity."*
  - Navigate to **Zone Configuration Canvas**:
    - *"Operators don't need machine learning expertise. They simply select any camera, click directly on the video feed to draw custom restricted zones, barbed wire buffer lines, or vehicle checkpoints, and define dwell-time sensitivity in seconds."*

### [02:30 - 03:45] The Live Simulated Intrusion & AI Analytics
- **Speaker (Dax - AI Specialist & Rajveer - Backend)**:
  - Trigger the live intrusion video test stream.
  - Show the target approaching the restricted zone:
    - *"Watch the screen. Our AI pipeline is running YOLOv8 object classification combined with ByteTrack multi-object tracking. Notice how the target maintains a consistent Track ID (#104) even when momentarily walking behind foliage."*
    - Point out the **Ground-Anchor point**: *"Instead of using the center of the bounding box, our spatial algorithm evaluates the ground contact point of the target's feet. This completely avoids false alarms caused by camera perspective or leaning objects."*
  - Target steps into the zone for 2 seconds:
    - **ALARM TRIGGERS**: Audio chime rings, a glowing red indicator pulses on the camera card, and a high-priority alert card appears instantly at the top of the feed via WebSockets.

### [03:45 - 04:30] Incident Response, Forensics & Chain of Custody
- **Speaker (Neel - Backend & Vivek - Lead)**:
  - Operator clicks **"Acknowledge"**: Siren sound ceases; card changes state to "Claimed by Officer Sharma" across all connected screens.
  - Open the **Incident Evidence Modal**:
    - Show the annotated high-resolution snapshot with bounding box, zone coordinates, and timestamp.
    - Highlight the **SHA-256 cryptographic hash**: *"For legal and military accountability, every piece of evidence is hashed at the moment of capture, guaranteeing an immutable forensic chain of custody."*
  - Enter resolution notes: *"Quick Reaction Team dispatched. Perimeter secured."*
  - Click **"Resolve"**: The event is archived into the historical audit log.

### [04:30 - 05:00] Conclusion, Impact & Q&A Transition
- **Speaker (Vivek)**:
  - *"In summary, BorderGuard AI is cost-effective, plug-and-play, offline-resilient, and built to empower our brave border sentinels, never to replace their critical judgment. Thank you, and we are ready for your questions."*
