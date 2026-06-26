import dashscope
from dashscope.audio.tts import SpeechSynthesizer
import os
from dotenv import load_dotenv

load_dotenv()
dashscope.api_key = os.environ.get('DASHSCOPE_API_KEY')
dashscope.base_http_api_url = os.environ.get('DASHSCOPE_BASE_URL')

result = SpeechSynthesizer.call(
    model='sambert-zhichu-v1', 
    text='Hello world, this is a test of the text to speech.', 
    sample_rate=24000, 
    format='mp3'
)
if result.get_audio_data():
    print(f"Got audio: {len(result.get_audio_data())} bytes")
else:
    print(result.get_response())
