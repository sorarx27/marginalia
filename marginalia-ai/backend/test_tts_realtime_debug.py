import os
import wave
import threading
import sys
from dotenv import load_dotenv
import dashscope
from dashscope.audio.qwen_tts_realtime import QwenTtsRealtime, QwenTtsRealtimeCallback, AudioFormat

load_dotenv()
dashscope.api_key = os.environ.get('DASHSCOPE_API_KEY')
ws_url = "wss://ws-rby6gc1lnxa52f71.ap-southeast-1.maas.aliyuncs.com/api-ws/v1/realtime"

class MyCallback(QwenTtsRealtimeCallback):
    def __init__(self, filename):
        self.filename = filename
        self.file = None
        self.done_event = threading.Event()
        self.audio_received = 0

    def on_open(self):
        print('[CALLBACK] Connected!')
        try:
            self.file = wave.open(self.filename, 'wb')
            self.file.setnchannels(1)
            self.file.setsampwidth(2)
            self.file.setframerate(24000)
            print('[CALLBACK] Wave file opened successfully.')
        except Exception as e:
            print(f'[CALLBACK] Error opening wave file: {e}')

    def on_error(self, message):
        print(f'[CALLBACK] Error received: {message}')
        self.done_event.set()

    def on_close(self, *args, **kwargs):
        print(f'[CALLBACK] Connection closed. args={args}, kwargs={kwargs}')
        if self.file:
            try:
                self.file.close()
                print('[CALLBACK] Wave file closed.')
            except Exception as e:
                print(f'[CALLBACK] Error closing wave file: {e}')
        self.done_event.set()

    def on_data(self, data: bytes) -> None:
        self.audio_received += len(data)
        print(f'[CALLBACK] Received {len(data)} bytes of audio data (Total: {self.audio_received} bytes)')
        if self.file:
            try:
                self.file.writeframes(data)
            except Exception as e:
                print(f'[CALLBACK] Error writing audio frames: {e}')

def run_test():
    print("Starting QwenTtsRealtime Test...")
    cb = MyCallback('out_debug.wav')
    
    # We pass the model parameter explicitly to the URL too as discussed in Model Studio guidelines
    full_ws_url = f"{ws_url}?model=qwen3-tts-flash-realtime"
    print(f"Connecting to: {full_ws_url}")
    
    try:
        q = QwenTtsRealtime(model='qwen3-tts-flash-realtime', callback=cb, url=full_ws_url)
        print("Client instance created.")
        
        q.connect()
        print("Connected initiated.")
        
        print("Updating session to voice='Jennifer'...")
        q.update_session(
            voice='Jennifer', 
            response_format=AudioFormat.PCM_24000HZ_MONO_16BIT, 
            mode='server_commit'
        )
        print("Session updated.")
        
        text = "Hello, this is Liora! Welcome to your digital bookshelf companion."
        print(f"Sending text: '{text}'")
        q.append_text(text)
        
        print("Finishing text stream...")
        q.finish()
        print("Stream finished. Waiting for callback...")
        
        # Wait up to 10 seconds for completion
        completed = cb.done_event.wait(timeout=10)
        if not completed:
            print("Timeout reached waiting for audio.")
        else:
            print(f"Done! Received total of {cb.audio_received} bytes of audio.")
            
        q.close()
        print("Connection closed.")
    except Exception as e:
        print(f"Exception during execution: {e}", file=sys.stderr)

if __name__ == "__main__":
    run_test()
