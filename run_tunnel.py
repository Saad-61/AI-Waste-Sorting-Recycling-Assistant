"""
Official ngrok tunnel launcher for AI Waste Sorting & Recycling Assistant.
Runs the Python ngrok SDK (safe from Windows Defender) and forwards to port 5173.
"""

import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv
import ngrok

# Load variables from .env file
ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

AUTHTOKEN = os.getenv("NGROK_AUTHTOKEN")
DOMAIN = os.getenv("NGROK_DOMAIN", "alongside-vagueness-unfitted.ngrok-free.dev")
LOCAL_PORT = "localhost:5173"

if not AUTHTOKEN:
    print("[!] ERROR: NGROK_AUTHTOKEN not found in .env file.", flush=True)
    print("    Please add 'NGROK_AUTHTOKEN=your_token_here' to your .env file.", flush=True)
    sys.exit(1)


def start_tunnel():
    print("=" * 65, flush=True)
    print("  AI Waste Sorting Assistant - Public Tunnel (ngrok Python SDK)", flush=True)
    print("=" * 65, flush=True)
    print(f"[*] Forwarding traffic to local Vite server ({LOCAL_PORT})...", flush=True)

    try:
        listener = ngrok.forward(
            LOCAL_PORT,
            authtoken=AUTHTOKEN,
            domain=DOMAIN
        )
        url = listener.url()
        print(f"\n[+] Tunnel is ONLINE and ACTIVE!", flush=True)
        print(f"[+] Public Web App URL: {url}", flush=True)
        print("\n[*] You can open this link on your phone, tablet, or external PC.", flush=True)
        print("[*] Both Frontend and Backend API calls (/api/...) are forwarded.", flush=True)
        print("[*] Press Ctrl + C to stop the tunnel at any time.\n", flush=True)
        print("=" * 65, flush=True)

        # Keep running until Ctrl + C
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[*] Shutting down ngrok tunnel...")
        try:
            ngrok.disconnect(DOMAIN)
        except Exception:
            pass
        print("[+] Tunnel closed cleanly.")
    except Exception as e:
        print(f"\n[!] Error starting tunnel: {e}")
        sys.exit(1)


if __name__ == "__main__":
    start_tunnel()
