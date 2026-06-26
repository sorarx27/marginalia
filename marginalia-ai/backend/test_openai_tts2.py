import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get('DASHSCOPE_API_KEY')
base_url = "https://ws-rby6gc1lnxa52f71.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/audio/speech"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

payload = {
    "model": "cosyvoice-v1",
    "input": "Hello, this is Liora! Welcome to Marginalia.",
    "voice": "longxiaochun"
}

response = requests.post(base_url, headers=headers, json=payload)
print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    print(f"Success! Audio data size: {len(response.content)} bytes")
    with open('test_openai_tts.mp3', 'wb') as f:
        f.write(response.content)
else:
    print(response.text)
