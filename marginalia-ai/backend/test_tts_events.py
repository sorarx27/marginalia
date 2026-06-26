import os
import threading
import sys
import json
import base64
from dotenv import load_dotenv
import dashscope
from dashscope.audio.qwen_tts_realtime import QwenTtsRealtime, QwenTtsRealtimeCallback, AudioFormat

load_dotenv()
dashscope.api_key = os.environ.get('DASHSCOPE_API_KEY')
# Real-time service URL
ws_url = "wss://ws-rby6gc1lnxa52f71.ap-southeast-1.maas.aliyuncs.com/api-ws/v1/realtime"

class EventLoggerCallback(QwenTtsRealtimeCallback):
    def __init__(self):
        self.done_event = threading.Event()
        self.audio_file = open('events_audio.mp3', 'wb')
        self.audio_bytes_written = 0

    def on_open(self):
        print('[EVENT_LOG] Connected!')

    def on_close(self, close_status_code, close_msg):
        print(f'[EVENT_LOG] Connection closed. Code: {close_status_code}, Msg: {close_msg}')
        self.audio_file.close()
        self.done_event.set()

    def on_event(self, message) -> None:
        # message is a dictionary parsed from the JSON string
        event_type = message.get('type')
        print(f'[EVENT_LOG] Event: {event_type}, Keys: {list(message.keys())}')
        
        if event_type == 'response.audio.delta':
            delta = message.get('delta', {})
            # Wait, let's see where the audio data is located. Is it in message['delta'] or message['audio']?
            print(f'            Delta keys: {list(delta.keys()) if isinstance(delta, dict) else "Not a dict"}')
            # Let's see if there is audio data
            audio_data_b64 = message.get('audio') or message.get('delta') or message.get('response', {}).get('audio')
            if isinstance(delta, dict) and 'audio' in delta:
                audio_data_b64 = delta['audio']
            elif isinstance(message, dict) and 'audio' in message:
                audio_data_b64 = message['audio']
                
            if audio_data_b64 and isinstance(audio_data_b64, str):
                try:
                    audio_bytes = base64.b64decode(audio_data_b64)
                    self.audio_file.write(audio_bytes)
                    self.audio_bytes_written += len(audio_bytes)
                    print(f'            Successfully decoded and wrote {len(audio_bytes)} bytes of audio.')
                except Exception as e:
                    print(f'            Error decoding audio: {e}')

def run_test():
    cb = EventLoggerCallback()
    # Let's connect without appending the query model param to the URL first, as in test_tts3.py (which succeeded in connecting)
    q = QwenTtsRealtime(model='qwen3-tts-flash-realtime', callback=cb, url=ws_url)
    
    try:
        q.connect()
        print("Connected. Updating session...")
        
        # We can try voice='Jennifer' and format='mp3'
        q.update_session(
            voice='Jennifer', 
            response_format=AudioFormat.PCM_24000HZ_MONO_16BIT, # Let's keep response_format but try audio_format='mp3'
            audio_format='mp3',
            mode='server_commit'
        )
        print("Session updated. Sending text...")
        
        q.append_text("Hello, this is Liora! I am your reading companion.")
        q.finish()
        print("Stream finished. Waiting for events...")
        
        cb.done_event.wait(timeout=10)
        q.close()
        print(f"Done! Saved {cb.audio_bytes_written} bytes of audio to events_audio.mp3.")
    except Exception as e:
        print(f"Error during test: {e}")

if __name__ == '__main__':
    run_test()
