---
name: alibaba-cloud-ram
description: Guidelines for managing Alibaba Cloud RAM (Resource Access Management) for authentication and authorization.
---
# Alibaba Cloud RAM Skill

Use this skill to manage identity, users, roles, and permissions in Alibaba Cloud (similar to AWS IAM or GCP IAM).

## CLI Usage (`aliyun`)

- **List users**: `aliyun ram ListUsers`
- **Create user**: `aliyun ram CreateUser --UserName <user_name>`
- **Create Access Key**: `aliyun ram CreateAccessKey --UserName <user_name>`
- **Attach policy to user**: `aliyun ram AttachPolicyToUser --PolicyType System --PolicyName <policy_name> --UserName <user_name>`
- **List policies**: `aliyun ram ListPolicies`

## Python SDK (`alibabacloud_ram20150501`)
To interact programmatically:
1. **Install**: `pip install alibabacloud_ram20150501`
2. **Setup**:
```python
from alibabacloud_ram20150501.client import Client as RamClient
from alibabacloud_tea_openapi import models as open_api_models

config = open_api_models.Config(
    access_key_id='<your-access-key-id>',
    access_key_secret='<your-access-key-secret>'
)
config.endpoint = f'ram.aliyuncs.com'
client = RamClient(config)
```
