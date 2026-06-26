import dashscope
from dashscope.audio.qwen_tts_realtime import QwenTtsRealtime, QwenTtsRealtimeCallback
import os
from dotenv import load_dotenv

load_dotenv()
dashscope.api_key = os.environ.get('DASHSCOPE_API_KEY')

ws_url = "wss://ws-rby6gc1lnxa52f71.ap-southeast-1.maas.aliyuncs.com/api-ws/v1/realtime"

class MyCallback(QwenTtsRealtimeCallback):
    def on_open(self):
        print('Connected!')
    def on_error(self, message):
        print(f'Error: {message}')

q = QwenTtsRealtime(model='qwen3-tts-flash-realtime', callback=MyCallback(), url=ws_url)
q.connect()
