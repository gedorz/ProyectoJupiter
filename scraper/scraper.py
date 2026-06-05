import requests
from bs4 import BeautifulSoup
import time
import logging
import os


SCRAPER_URL = os.getenv("SCRAPER_URL", "https://example.com")
SCRAPER_INTERVAL_SECONDS = int(os.getenv("SCRAPER_INTERVAL_SECONDS", "3600"))
SCRAPER_TIMEOUT_SECONDS = int(os.getenv("SCRAPER_TIMEOUT_SECONDS", "20"))
SCRAPER_OUTPUT_FILE = os.getenv("SCRAPER_OUTPUT_FILE", "/data/scraped_data.txt")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

def scrape_data():
    response = requests.get(SCRAPER_URL, timeout=SCRAPER_TIMEOUT_SECONDS)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    # Lógica de scraping
    title = soup.find("title")
    data = title.text.strip() if title else "title_not_found"
    with open(SCRAPER_OUTPUT_FILE, 'a', encoding='utf-8') as f:
        f.write(f"{time.time()}: {data}\n")
    logging.info("Scrape exitoso desde %s", SCRAPER_URL)

if __name__ == "__main__":
    while True:
        try:
            scrape_data()
        except requests.RequestException as exc:
            logging.error("Error de red/SSL al scrapear %s: %s", SCRAPER_URL, exc)
        except Exception as exc:
            logging.exception("Fallo inesperado en scraper: %s", exc)

        time.sleep(SCRAPER_INTERVAL_SECONDS)  # Scrapear segun intervalo configurado