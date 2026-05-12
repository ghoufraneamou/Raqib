from groq import Groq
import os
from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """
Tu es un assistant intelligent de la plateforme AMMPS.

Tu aides les utilisateurs à:
- créer un compte
- déposer un dossier
- suivre une demande
- payer les frais
- contacter les services

RÈGLES IMPORTANTES:
- Si l'utilisateur parle en arabe → réponds en arabe
- Si l'utilisateur parle en français → réponds en français
- Si la langue n'est pas claire → réponds en français
- Sois clair, simple et professionnel
"""

def ask_ai(question: str) -> str:
    try:
        chat = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": question}
            ],
            temperature=0.3,
        )

        return chat.choices[0].message.content

    except Exception as e:
        return "Erreur IA: " + str(e)