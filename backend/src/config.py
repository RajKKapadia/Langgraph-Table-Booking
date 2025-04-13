import os

from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

SERVER_API_KEY = os.getenv("SERVER_API_KEY")

PORT = os.getenv("PORT")

OPENAI_MODEL = "gpt-4o-mini"

API_VERSION = "v0"

ERROR_MESSAGE = "We are facing an issue, please try after sometimes."
