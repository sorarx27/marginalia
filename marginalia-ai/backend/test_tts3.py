import dashscope
from dashscope.audio.qwen_tts_realtime import QwenTtsRealtime, QwenTtsRealtimeCallback, AudioFormat
import os
import wave
import threading
from dotenv import load_dotenv

load_dotenv()
dashscope.api_key = os.environ.get('DASHSCOPE_API_KEY')
ws_url = "wss://ws-rby6gc1lnxa52f71.ap-southeast-1.maas.aliyuncs.com/api-ws/v1/realtime"

class MyCallback(QwenTtsRealtimeCallback):
    def __init__(self, filename):
        self.filename = filename
        self.file = None
        self.done_event = threading.Event()

    def on_open(self):
        print('Connected!')
        self.file = wave.open(self.filename, 'wb')
        self.file.setnchannels(1)
        self.file.setsampwidth(2)
        self.file.setframerate(24000)

    def on_error(self, message):
        print(f'Error: {message}')
        self.done_event.set()

    def on_close(self, *args, **kwargs):
        print('Connection closed by server.')
        if self.file:
            self.file.close()
        self.done_event.set()

    def on_data(self, data: bytes) -> None:
        print(f'Received data: {len(data)} bytes')
        if self.file:
            self.file.writeframes(data)

cb = MyCallback('out.wav')
q = QwenTtsRealtime(model='qwen3-tts-flash-realtime', callback=cb, url=ws_url)
q.connect()
q.update_session(voice='jennifer', response_format=AudioFormat.PCM_24000HZ_MONO_16BIT, mode='commit')
q.append_text("Hello, this is Liora! Welcome to Marginalia.")
q.commit()
print("Committed. Waiting for audio...")

cb.done_event.wait(timeout=15)
q.close()
