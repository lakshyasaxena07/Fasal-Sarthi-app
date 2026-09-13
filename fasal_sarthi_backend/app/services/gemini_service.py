import json
import requests

class GeminiService:
    def __init__(self, api_key=None, timeout=30):
        self.api_key = api_key
        self.timeout = timeout

    def get_api_url(self):
        if not self.api_key:
            return None
        return f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={self.api_key}"

    def generate_reply(self, user_message, language_code='hi', chat_history=None):
        if not self.api_key:
            raise ValueError("Chatbot API key not configured.")

        if not user_message:
            raise ValueError("No message provided")

        chat_history = chat_history or []

        if language_code == 'hi':
            system_prompt = """
                तुम 'फसल सारथी' हो, एक विशेषज्ञ AI सहायक जो केवल हिंदी में किसानों की मदद करते हो।
                तुम्हारे जवाब हमेशा सरल, मददगार और खेती से संबंधित होने चाहिए।
                तुम्हें हमेशा, बिना किसी अपवाद के, केवल और केवल हिंदी (देवनागरी लिपि) में ही जवाब देना है।
                अगर कोई खेती से अलग सवाल पूछे, तो विनम्रता से मना कर दो कि 'मैं सिर्फ खेती से जुड़े सवालों का जवाब दे सकता हूँ।'
            """
        else:
            system_prompt = """
                You are 'Fasal Sarthi', an expert AI assistant who helps farmers with agriculture.
                You must respond *only* in English.
                Your answers should always be simple, helpful, and related to farming.
                If asked a non-farming question, politely decline, stating you only answer farming-related questions.
            """

        contents = [{"role": "user", "parts": [{"text": system_prompt.strip()}]}]
        for msg in chat_history:
            api_role = "user" if msg.get('role') == "user" else "model"
            contents.append({"role": api_role, "parts": [{"text": msg.get('message', '')}]})
        contents.append({"role": "user", "parts": [{"text": user_message}]})

        payload = {"contents": contents}
        headers = {"Content-Type": "application/json"}

        response = requests.post(
            self.get_api_url(),
            headers=headers,
            data=json.dumps(payload),
            timeout=self.timeout
        )

        if response.status_code != 200:
            raise RuntimeError(f"Google API returned error status {response.status_code}: {response.text}")

        response_data = response.json()
        bot_response = response_data['candidates'][0]['content']['parts'][0]['text']
        return bot_response
