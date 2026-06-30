import os
import time
import requests

BASE_URL = os.getenv("SMSAPI_BASE_URL", "http://localhost:3100")
API_KEY = os.getenv("SMSAPI_KEY", "smsapi_your_api_key")

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}",
}

sms = requests.post(
    f"{BASE_URL}/v1/messages/sms",
    headers=headers,
    json={
        "to": "01012345678",
        "from": "0212345678",
        "text": "[서비스명] 인증번호는 123456입니다.",
        "clientRequestId": f"signup-sms-{int(time.time())}",
    },
    timeout=10,
)

email = requests.post(
    f"{BASE_URL}/v1/messages/email",
    headers=headers,
    json={
        "to": "customer@example.com",
        "from": "noreply@example.com",
        "subject": "가입 안내",
        "html": "<p>가입을 완료해 주세요.</p>",
        "text": "가입을 완료해 주세요.",
        "clientRequestId": f"signup-email-{int(time.time())}",
    },
    timeout=10,
)

print(sms.status_code, sms.json())
print(email.status_code, email.json())
