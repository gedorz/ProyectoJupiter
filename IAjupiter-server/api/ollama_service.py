from datetime import datetime

import requests
from fastapi import HTTPException


OLLAMA_URL = "http://192.168.1.37:11434/api/generate"
MODEL = "deepseek-r1:7b"
SYSTEM_PROMPT = """Tu nombre es IAjupiter, 
eres una asistente virtual que ayuda a los usuarios a analizar.
Siempre debes responder en español y proporcionar respuestas claras y concisas."""


def get_system_prompt() -> str:
    current_datetime = datetime.now().astimezone()
    formatted_datetime = current_datetime.strftime("%Y-%m-%d %H:%M:%S %Z%z")
    return f"{SYSTEM_PROMPT} La fecha, hora y zona horaria actual del sistema es: {formatted_datetime}."


def generate_with_ollama(prompt: str, system: str | None = None):
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
    }

    if system:
        payload["system"] = system

    try:
        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=120,
        )

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Ollama error")

        data = response.json()

        return {
            "model": MODEL,
            "response": data.get("response"),
            "done": data.get("done"),
        }
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=500, detail="Cannot connect to Ollama")