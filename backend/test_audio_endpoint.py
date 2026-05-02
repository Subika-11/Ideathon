
import requests
import sys

def test_audio(track):
    url = f"http://localhost:8000/play-audio?track={track}"
    try:
        response = requests.post(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    track = sys.argv[1] if len(sys.argv) > 1 else 1
    test_audio(track)
