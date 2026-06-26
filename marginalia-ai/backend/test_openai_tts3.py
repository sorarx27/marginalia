import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get('DASHSCOPE_API_KEY')
base_url = "https://ws-rby6gc1lnxa52f71.ap-southeast-1.maas.aliyuncs.com/api/v1/services/audio/text-to-speech/text-to-audio"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

payload = {
    "model": "qwen3-tts-flash",
    "input": {
        "text": "Hello, this is Liora!"
    },
    "parameters": {
        "voice": "jennifer"
    }
}

response = requests.post(base_url, headers=headers, json=payload)
print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    print(f"Success! Audio data size: {len(response.content)} bytes")
    with open('test_openai_tts.mp3', 'wb') as f:
        f.write(response.content)
else:
    try:
        print(response.content.decode('utf-8'))
    except:
        print("Could not decode response")
