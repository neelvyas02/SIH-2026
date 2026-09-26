"""
BorderGuard AI - Google Drive / Google One (5 TB) Automatic Sync Utility
Provides automated cloud backup capabilities for storage snapshots, crops, and database records.
"""

import os
import sys
import time
import subprocess
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [GDRIVE-SYNC] %(message)s")
logger = logging.getLogger("borderguard.gdrive_sync")


class GoogleDriveSyncManager:
    """Manages cloud synchronization to Google Drive / Google One 5 TB storage using rclone or python SDK."""

    def __init__(self, local_storage_dir: str, remote_name: str = "googleone", remote_folder: str = "BorderGuard_Backup"):
        self.local_storage_dir = os.path.abspath(local_storage_dir)
        self.remote_name = remote_name
        self.remote_folder = remote_folder

    def is_rclone_installed(self) -> bool:
        try:
            res = subprocess.run(["rclone", "version"], capture_output=True, text=True)
            return res.returncode == 0
        except Exception:
            return False

    def sync_storage_to_cloud(self) -> bool:
        """Executes one-way sync from local storage directory to Google Drive remote."""
        if not self.is_rclone_installed():
            logger.warning("[!] rclone binary not found in system PATH. Install rclone from https://rclone.org to enable background 5 TB Google One auto-sync.")
            return False

        remote_path = f"{self.remote_name}:{self.remote_folder}/storage"
        logger.info(f"Starting cloud backup sync: {self.local_storage_dir} -> {remote_path}...")

        cmd = [
            "rclone", "sync",
            self.local_storage_dir,
            remote_path,
            "--progress",
            "--transfers", "4",
            "--create-empty-src-dirs"
        ]

        try:
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode == 0:
                logger.info("[+] Google Drive 5 TB sync completed successfully!")
                return True
            else:
                logger.error(f"[-] Rclone sync failed: {res.stderr}")
                return False
        except Exception as e:
            logger.error(f"[-] Failed to execute rclone sync command: {e}")
            return False


if __name__ == "__main__":
    storage_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../storage"))
    sync_mgr = GoogleDriveSyncManager(local_storage_dir=storage_path)
    print("Testing Google Drive Sync Configuration...")
    sync_mgr.sync_storage_to_cloud()
