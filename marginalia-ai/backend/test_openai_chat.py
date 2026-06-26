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
    response = client.chat.completions.create(
        model="qwen-turbo", # or another model
        messages=[{"role": "user", "content": "Hello!"}]
    )
    print("Chat Success!")
    print(response.choices[0].message.content)
except Exception as e:
    print(f"Chat Error: {e}")
