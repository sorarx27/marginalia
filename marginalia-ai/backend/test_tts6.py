import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get('DASHSCOPE_API_KEY')
base_url = os.environ.get('DASHSCOPE_BASE_URL')

url = f"{base_url}/services/audio/text-to-speech/text-to-audio"
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json",
    "X-DashScope-WorkSpace": "" 
}
payload = {
    "model": "qwen3-tts-flash-realtime",
    "input": {
        "text": "Hello, this is Liora!"
    },
    "parameters": {
        "voice": "jennifer",
        "format": "mp3",
        "sample_rate": 24000
    }
}
response = requests.post(url, headers=headers, json=payload)
with open('response.txt', 'w', encoding='utf-8') as f:
    f.write(response.text)
