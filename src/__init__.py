import sys
import logging

logging_str = "[%(asctime)s]: %(levelname)s -> %(module)s -> %(message)s"

logging.basicConfig(
    level=logging.INFO, format=logging_str, handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("table-booking")
