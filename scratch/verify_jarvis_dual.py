import requests
import json

url = "http://127.0.0.1:8000/api/v1/chat/completions"
payload = {
    "student_id": "STU-101",
    "stream": False,
    "messages": [
        {"role": "user", "content": "How do I look for the TechCorp drive?"}
    ]
}

res = requests.post(url, json=payload, timeout=60)
print("Status code:", res.status_code)
if res.status_code == 200:
    data = res.json()
    choice = data.get("choices", [{}])[0]
    msg = choice.get("message", {}).get("content", "")
    print("\n=== RESPONSE CONTENT ===")
    print(msg)
    print("\n=== TRACE MCP TOOLS ===")
    trace = data.get("trace", {})
    print("MCP tools called:", trace.get("mcp_tools", []))
    print("Intent:", trace.get("intent", ""))
else:
    print("Error:", res.text)
