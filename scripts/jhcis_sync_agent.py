#!/usr/bin/env python3
"""
JHCIS MySQL Direct Sync Agent
-----------------------------
สคริปต์นี้ใช้สำหรับรันในคอมพิวเตอร์ Local ของ รพ.สต. เพื่อเชื่อมต่อ JHCIS MySQL Database
และส่งข้อมูลรายการยา (cdrug) และสต็อกยาไปยัง Web App คลังยา
"""

import sys
import json
import urllib.request

def main():
    print("==================================================")
    print(" JHCIS Direct MySQL Sync Agent")
    print("==================================================")
    print("กรุณาติดตั้ง mysql-connector-python ก่อนใช้งาน:")
    print("pip install mysql-connector-python\n")

    config_example = {
        "jhcis_db": {
            "host": "localhost",
            "port": 3306,
            "user": "root",
            "password": "",
            "database": "jhcisdb"
        },
        "webapp_api": "https://your-domain.supabase.co/rest/v1/medicines"
    }

    print("ตัวอย่างการตั้งค่าฐานข้อมูล JHCIS:")
    print(json.dumps(config_example, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
