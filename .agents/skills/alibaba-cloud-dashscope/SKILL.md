---
name: alibaba-cloud-dashscope
description: Guidelines for interacting with Alibaba Cloud DashScope (Qwen AI models).
---
# Alibaba Cloud DashScope (AI) Skill

Use this skill to invoke Alibaba Cloud's AI models, particularly the Qwen series (Tongyi Qianwen), via the DashScope API.

## Python SDK (`dashscope`)
The primary way to interact with Alibaba Cloud AI models is using the `dashscope` Python SDK.

1. **Install**: `pip install dashscope`
2. **Setup API Key**: Set the environment variable `DASHSCOPE_API_KEY`.
    - Windows PowerShell: `$env:DASHSCOPE_API_KEY="sk-..."`
    - Or within Python: `import dashscope; dashscope.api_key = "sk-..."`

### Text Generation (Qwen)
```python
import dashscope
from dashscope import Generation

response = Generation.call(
    model='qwen-max', # Or 'qwen-plus', 'qwen-turbo'
    prompt='Explain the benefits of cloud computing.',
    result_format='message'  # Use message format for chat completions
)

if response.status_code == 200:
    print(response.output.choices[0].message.content)
else:
    print(f"Request failed: {response.code} - {response.message}")
```

### Vision Models (Qwen-VL)
```python
import dashscope
from dashscope import MultiModalConversation

messages = [
    {
        "role": "user",
        "content": [
            {"image": "https://example.com/image.jpg"},
            {"text": "What is in this image?"}
        ]
    }
]

response = MultiModalConversation.call(model='qwen-vl-plus', messages=messages)
```
