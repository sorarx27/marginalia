import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get('DASHSCOPE_API_KEY')
base_url = "https://ws-rby6gc1lnxa52f71.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1"

client = OpenAI(
    api_key=api_key,
    base_url=base_url,
)

try:
    response = client.audio.speech.create(
        model="qwen3-tts-flash-realtime", # or maybe cosyvoice-v1
        voice="jennifer", # or alloy
        input="Hello, this is Liora! Welcome to Marginalia."
    )
    response.stream_to_file("output.mp3")
    print("Success! Saved to output.mp3")
except Exception as e:
    print(f"Error: {e}")
