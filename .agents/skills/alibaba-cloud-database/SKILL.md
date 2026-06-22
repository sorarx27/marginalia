---
name: alibaba-cloud-database
description: Guidelines for managing Alibaba Cloud Databases (RDS, PolarDB).
---
# Alibaba Cloud Database Skill

Use this skill when interacting with Alibaba Cloud databases like ApsaraDB RDS or PolarDB.

## CLI Usage (`aliyun`)

### RDS
- **List instances**: `aliyun rds DescribeDBInstances --RegionId <region_id>`
- **Describe instance**: `aliyun rds DescribeDBInstanceAttribute --DBInstanceId <instance_id>`

### PolarDB
- **List clusters**: `aliyun polardb DescribeDBClusters --RegionId <region_id>`
- **Describe cluster**: `aliyun polardb DescribeDBClusterAttribute --DBClusterId <cluster_id>`

## Python SDK (`alibabacloud_rds20140815` / `alibabacloud_polardb20170801`)
To interact programmatically:
1. **Install**: `pip install alibabacloud_rds20140815 alibabacloud_polardb20170801`
2. **Setup RDS**:
```python
from alibabacloud_rds20140815.client import Client as RdsClient
from alibabacloud_tea_openapi import models as open_api_models

config = open_api_models.Config(
    access_key_id='<your-access-key-id>',
    access_key_secret='<your-access-key-secret>'
)
config.endpoint = f'rds.aliyuncs.com'
client = RdsClient(config)
```
