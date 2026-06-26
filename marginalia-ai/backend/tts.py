import os
import io
import threading
import base64
import logging
from dotenv import load_dotenv
import dashscope
from dashscope.audio.qwen_tts_realtime import QwenTtsRealtime, QwenTtsRealtimeCallback, AudioFormat

# Setup basic logging
logger = logging.getLogger("marginalia.tts")
load_dotenv()

# Set dashscope API key
dashscope.api_key = os.environ.get('DASHSCOPE_API_KEY')
WS_URL = "wss://ws-rby6gc1lnxa52f71.ap-southeast-1.maas.aliyuncs.com/api-ws/v1/realtime"

class TTSBufferCallback(QwenTtsRealtimeCallback):
    def __init__(self):
        self.buffer = io.BytesIO()
        self.done_event = threading.Event()
        self.error_message = None

    def on_open(self):
        logger.info("WebSocket connected for TTS synthesis.")

    def on_close(self, close_status_code, close_msg):
        logger.info(f"WebSocket connection closed. Code: {close_status_code}, Msg: {close_msg}")
        self.done_event.set()

    def on_error(self, error):
        logger.error(f"WebSocket error in TTS callback: {error}")
        self.error_message = str(error)
        self.done_event.set()

    def on_event(self, message) -> None:
        event_type = message.get('type')
        if event_type == 'response.audio.delta':
            delta_b64 = message.get('audio') or message.get('delta')
            if isinstance(message.get('delta'), str):
                delta_b64 = message['delta']
            
            if delta_b64 and isinstance(delta_b64, str):
                try:
                    audio_bytes = base64.b64decode(delta_b64)
                    self.buffer.write(audio_bytes)
                except Exception as e:
                    logger.error(f"Error decoding base64 audio delta: {e}")
        elif event_type == 'response.done':
            logger.info("TTS synthesis response.done received.")
            self.done_event.set()

def synthesize_speech(text: str) -> bytes:
    """
    Synthesize text into MP3 speech using Qwen3-TTS-Flash-Realtime.
    Returns the raw audio bytes (MP3 format).
    """
    if not text or not text.strip():
        return b""
        
    cb = TTSBufferCallback()
    
    # We do NOT append model param to URL as DashScope's QwenTtsRealtime manages it.
    q = QwenTtsRealtime(
        model='qwen3-tts-flash-realtime', 
        callback=cb, 
        url=WS_URL
    )
    
    try:
        logger.info(f"Connecting to Qwen Real-time TTS for text: {text[:40]}...")
        q.connect()
        
        # Configure session to use 'jennifer' and export MP3 format
        q.update_session(
            voice='jennifer',
            response_format=AudioFormat.PCM_24000HZ_MONO_16BIT, # response_format is a required placeholder
            audio_format='mp3', # overrules format to MP3
            mode='server_commit'
        )
        
        q.append_text(text)
        q.finish()
        
        # Wait for the synthesis to finish (up to 15 seconds)
        success = cb.done_event.wait(timeout=15.0)
        
        q.close()
        
        if cb.error_message:
            raise Exception(f"WebSocket Error: {cb.error_message}")
            
        if not success:
            logger.warning("TTS synthesis timed out.")
            
        audio_data = cb.buffer.getvalue()
        logger.info(f"TTS synthesis complete. Produced {len(audio_data)} bytes of audio.")
        return audio_data
        
    except Exception as e:
        logger.error(f"Failed to synthesize speech using Qwen3-TTS: {e}")
        # Always make sure connection is closed
        try:
            q.close()
        except:
            pass
        raise e
