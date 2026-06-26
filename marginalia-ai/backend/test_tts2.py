import dashscope
from dashscope.audio.tts import SpeechSynthesizer
import os
from dotenv import load_dotenv

load_dotenv()
dashscope.api_key = os.environ.get('DASHSCOPE_API_KEY')
# Set both HTTP and Websocket URLs for the Maas deployment
dashscope.base_http_api_url = os.environ.get('DASHSCOPE_BASE_URL')
# Assuming base websocket url replaces 'https://' with 'wss://' and '/api/v1' with '/api-ws/v1'
ws_url = "wss://ws-rby6gc1lnxa52f71.ap-southeast-1.maas.aliyuncs.com/api-ws/v1"
dashscope.base_websocket_api_url = ws_url

result = SpeechSynthesizer.call(
    model='qwen3-tts-flash-realtime', 
    voice='jennifer', 
    text='Hello world, this is a test of the text to speech.', 
    sample_rate=24000, 
    format='mp3'
)
print("Result:")
if result.get_audio_data():
    print(f"Got audio: {len(result.get_audio_data())} bytes")
else:
    print(result.get_response())
