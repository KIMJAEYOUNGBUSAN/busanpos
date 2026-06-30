const SMSAPI_BASE_URL = process.env.SMSAPI_BASE_URL || "http://localhost:3100";
const SMSAPI_KEY = process.env.SMSAPI_KEY || "smsapi_your_api_key";

async function sendSms() {
  const response = await fetch(`${SMSAPI_BASE_URL}/v1/messages/sms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SMSAPI_KEY}`
    },
    body: JSON.stringify({
      to: "01012345678",
      from: "0212345678",
      text: "[서비스명] 인증번호는 123456입니다.",
      clientRequestId: `signup-sms-${Date.now()}`
    })
  });

  return response.json();
}

async function sendEmail() {
  const response = await fetch(`${SMSAPI_BASE_URL}/v1/messages/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SMSAPI_KEY}`
    },
    body: JSON.stringify({
      to: "customer@example.com",
      from: "noreply@example.com",
      subject: "가입 안내",
      html: "<p>가입을 완료해 주세요.</p>",
      text: "가입을 완료해 주세요.",
      clientRequestId: `signup-email-${Date.now()}`
    })
  });

  return response.json();
}

Promise.all([sendSms(), sendEmail()]).then(console.log).catch(console.error);
