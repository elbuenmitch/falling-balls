import os
import sys
import unittest
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase details - these should be defined in your .env file for testing
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

# Base URL for local server
BASE_URL = "http://localhost:3000"

class TestSettingsPersistence(unittest.TestCase):
    """Test cases for the game settings persistence feature"""
    
    def setUp(self):
        """Set up test environment"""
        self.session_id = "test_session_" + os.urandom(8).hex()
        self.test_settings = {
            "sessionId": self.session_id,
            "ballCount": 15,
            "ballRadius": 25,
            "obstacleCount": 10,
            "maxSize": 2.0,
            "movementSpeed": 3.0,
            "jumpForce": 0.2
        }
    
    def test_save_settings(self):
        """Test saving settings to the database"""
        response = requests.post(
            f"{BASE_URL}/api/settings",
            headers={"Content-Type": "application/json"},
            data=json.dumps(self.test_settings)
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("settings", data)
        self.assertEqual(data["settings"]["session_id"], self.session_id)
        self.assertEqual(data["settings"]["ball_count"], self.test_settings["ballCount"])
    
    def test_load_settings(self):
        """Test loading settings from the database"""
        # First save settings
        requests.post(
            f"{BASE_URL}/api/settings",
            headers={"Content-Type": "application/json"},
            data=json.dumps(self.test_settings)
        )
        
        # Then retrieve settings
        response = requests.get(
            f"{BASE_URL}/api/settings/{self.session_id}",
            headers={"Content-Type": "application/json"}
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("settings", data)
        self.assertEqual(data["settings"]["session_id"], self.session_id)
        self.assertEqual(data["settings"]["ball_count"], self.test_settings["ballCount"])
    
    def test_load_nonexistent_settings(self):
        """Test loading settings that don't exist"""
        nonexistent_id = "nonexistent_" + os.urandom(8).hex()
        response = requests.get(
            f"{BASE_URL}/api/settings/{nonexistent_id}",
            headers={"Content-Type": "application/json"}
        )
        
        self.assertEqual(response.status_code, 404)
    
    def test_update_existing_settings(self):
        """Test updating existing settings"""
        # First save initial settings
        requests.post(
            f"{BASE_URL}/api/settings",
            headers={"Content-Type": "application/json"},
            data=json.dumps(self.test_settings)
        )
        
        # Update settings
        updated_settings = self.test_settings.copy()
        updated_settings["ballCount"] = 30
        updated_settings["jumpForce"] = 0.3
        
        response = requests.post(
            f"{BASE_URL}/api/settings",
            headers={"Content-Type": "application/json"},
            data=json.dumps(updated_settings)
        )
        
        self.assertEqual(response.status_code, 201)
        
        # Verify updated settings
        response = requests.get(
            f"{BASE_URL}/api/settings/{self.session_id}",
            headers={"Content-Type": "application/json"}
        )
        
        data = response.json()
        self.assertEqual(data["settings"]["ball_count"], 30)
        self.assertEqual(data["settings"]["jump_force"], 0.3)


if __name__ == "__main__":
    unittest.main()
