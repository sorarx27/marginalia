---
name: alibaba-cloud-ecs
description: Guidelines and commands for managing Alibaba Cloud Elastic Compute Service (ECS) instances.
---
# Alibaba Cloud ECS Skill

Use this skill when interacting with Alibaba Cloud ECS (Elastic Compute Service) instances.

## CLI Usage (aliyun)
Ensure the Alibaba Cloud CLI (`aliyun`) is installed and configured.

- **List instances**: `aliyun ecs DescribeInstances --RegionId <region_id>`
- **Start an instance**: `aliyun ecs StartInstance --InstanceId <instance_id>`
- **Stop an instance**: `aliyun ecs StopInstance --InstanceId <instance_id>`

## Python SDK (`alibabacloud_ecs20140526`)
To interact programmatically:
1. **Install**: `pip install alibabacloud_ecs20140526`
2. **Setup**:
```python
from alibabacloud_ecs20140526.client import Client as EcsClient
from alibabacloud_tea_openapi import models as open_api_models

config = open_api_models.Config(
    access_key_id='<your-access-key-id>',
    access_key_secret='<your-access-key-secret>'
)
config.endpoint = f'ecs.cn-hangzhou.aliyuncs.com'
client = EcsClient(config)
```
