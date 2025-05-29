# email_scraper.py
# This is an adaptation of the original script for use with FastAPI

import os
import csv
import time
import re
import random
from datetime import datetime
from urllib.parse import urlparse, urljoin
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("email-scraper")

# Create output directory
os.makedirs("output", exist_ok=True)

# Set up basic logging to console
def log(message):
    """Print message with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    logger.info(f"[{timestamp}] {message}")

def setup_driver():
    """Set up Chrome WebDriver with optimal settings"""
    log("Setting up Chrome WebDriver...")

    try:
        options = Options()
        # Run in headless mode for server environment
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)

        # Use a realistic user agent
        user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        options.add_argument(f"--user-agent={user_agent}")

        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)

        # Set scripts to hide WebDriver use
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": """
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            """
        })

        driver.set_page_load_timeout(30)

        return driver
    except Exception as e:
        log(f"Error setting up Chrome WebDriver: {str(e)}")
        return None

def search_google(driver, query, max_pages=10):
    """Search Google and return a list of result URLs"""
    log(f"Searching Google for: {query}")
    all_urls = []

    for page in range(max_pages):
        try:
            # Build the search URL with page parameter
            if page == 0:
                url = f"https://www.google.com/search?q={query}"
            else:
                url = f"https://www.google.com/search?q={query}&start={page * 10}"

            log(f"Loading search page {page+1}: {url}")
            driver.get(url)

            # Wait for results to load
            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div.g"))
                )
            except TimeoutException:
                log("Timeout waiting for search results, checking if any results available")
                if len(driver.find_elements(By.CSS_SELECTOR, "a")) > 5:
                    log("Found alternative page structure, continuing")
                else:
                    log("No search results found, might be the last page")
                    break

            # Extract URLs from results
            results = []
            selectors = [
                "div.g a",
                "div.yuRUbf a",
                ".rc a",
                ".r a",
                "h3.LC20lb a",
                "div[data-header-feature] a"
            ]

            for selector in selectors:
                results = driver.find_elements(By.CSS_SELECTOR, selector)
                if results:
                    break

            if not results:
                results = driver.find_elements(By.TAG_NAME, "a")
                results = [r for r in results if r.get_attribute("href") and
                           r.get_attribute("href").startswith("http") and
                           "google" not in r.get_attribute("href")]

            page_urls = []
            for result in results:
                try:
                    href = result.get_attribute("href")
                    if href and not href.startswith("https://www.google.com") and href not in all_urls:
                        page_urls.append(href)
                except:
                    continue

            if not page_urls:
                log("No more result URLs found, likely reached the end of results")
                break

            log(f"Found {len(page_urls)} URLs on page {page+1}")
            all_urls.extend(page_urls)

            try:
                next_button = driver.find_element(By.ID, "pnnext")
                if not next_button:
                    log("No next page button found, reached the end of results")
                    break
            except NoSuchElementException:
                log("No next page button found, reached the end of results")
                break

            time.sleep(random.uniform(2, 4))

        except Exception as e:
            log(f"Error on search page {page+1}: {str(e)}")

    log(f"Total URLs found: {len(all_urls)}")
    return all_urls

def extract_emails_from_url(url):
    """Extract emails from a specific URL"""
    log(f"Extracting emails from: {url}")
    emails_found = set()

    try:
        # Set headers to mimic a browser
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml",
            "Accept-Language": "en-US,en;q=0.9"
        }

        # Request the page
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            log(f"Failed to access URL (status {response.status_code})")
            return []

        # Get content type
        content_type = response.headers.get('Content-Type', '').lower()
        if 'text/html' not in content_type and 'application/xhtml+xml' not in content_type:
            log(f"Skipping non-HTML content: {content_type}")
            return []

        # Parse HTML
        soup = BeautifulSoup(response.text, "html.parser")

        # Method 1: Extract from page text
        text = soup.get_text(" ", strip=True)
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        text_emails = re.findall(email_pattern, text)

        for email in text_emails:
            if is_valid_email(email):
                emails_found.add(email.lower())

        # Method 2: Extract from mailto links
        mailto_links = soup.select('a[href^="mailto:"]')
        for link in mailto_links:
            href = link.get('href', '')
            if href.startswith('mailto:'):
                email = href[7:].split('?')[0].strip()
                if email and is_valid_email(email):
                    emails_found.add(email.lower())

        # Method 3: Look in HTML source for obfuscated emails
        # Some sites use techniques to hide emails from simple scraping
        html = response.text.lower()

        # Look for common email obfuscation patterns
        obfuscation_patterns = [
            r'var\s+(\w+)\s*=\s*[\'"]([^@]+)[\'"][\s\+]*[\'"]@[\'"][\s\+]*[\'"]([^\'\"]+)[\'"]',
            r'(\w+)\s*=\s*[\'"]([^@]+)[\'"][\s\+]*[\'"]@[\'"][\s\+]*[\'"]([^\'\"]+)[\'"]',
            r'data-user=[\'"]([^\'\"]+)[\'"][\s\+]*data-domain=[\'"]([^\'\"]+)[\'"]',
            r'document\.write\([\'"]([^@]+)[\'"]\s*\+\s*[\'"]@[\'"][\s\+]*[\'"]([^\'\"]+)[\'"]'
        ]

        for pattern in obfuscation_patterns:
            matches = re.findall(pattern, html)
            for match in matches:
                if len(match) >= 2:
                    if len(match) == 3:
                        email = f"{match[1]}@{match[2]}"
                    else:
                        email = f"{match[0]}@{match[1]}"

                    if is_valid_email(email):
                        emails_found.add(email.lower())

        # Look for contact page if few or no emails found
        if len(emails_found) < 2:
            contact_url = find_contact_page(soup, url)
            if contact_url and contact_url != url:
                log(f"Following contact page: {contact_url}")
                try:
                    contact_response = requests.get(contact_url, headers=headers, timeout=15)
                    if contact_response.status_code == 200:
                        contact_soup = BeautifulSoup(contact_response.text, "html.parser")
                        contact_text = contact_soup.get_text(" ", strip=True)
                        contact_emails = re.findall(email_pattern, contact_text)

                        for email in contact_emails:
                            if is_valid_email(email):
                                emails_found.add(email.lower())

                        # Also check mailto links on contact page
                        contact_mailtos = contact_soup.select('a[href^="mailto:"]')
                        for link in contact_mailtos:
                            href = link.get('href', '')
                            if href.startswith('mailto:'):
                                email = href[7:].split('?')[0].strip()
                                if email and is_valid_email(email):
                                    emails_found.add(email.lower())
                except Exception as e:
                    log(f"Error accessing contact page: {str(e)}")

        # Log found emails
        if emails_found:
            log(f"Found {len(emails_found)} emails: {', '.join(emails_found)}")
        else:
            log("No emails found on this page")

        return list(emails_found)

    except Exception as e:
        log(f"Error extracting emails: {str(e)}")
        return []

def find_contact_page(soup, base_url):
    """Find a contact page URL from the current page"""
    contact_patterns = [
        'contact', 'contact us', 'get in touch', 'reach us', 'email us',
        'connect', 'about us', 'staff', 'faculty', 'team', 'directory'
    ]

    for link in soup.find_all('a', href=True):
        href = link.get('href', '')
        text = link.get_text().lower()

        if any(pattern in text for pattern in contact_patterns):
            full_url = urljoin(base_url, href)
            # Make sure it's on the same domain
            if urlparse(full_url).netloc == urlparse(base_url).netloc:
                return full_url

    return None

def is_valid_email(email):
    """Check if an email is valid"""
    # Basic validation
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False

    # Check for common exclusions
    exclusions = [
        'example.com', 'domain.com', 'email.com', 'yourname',
        'username', 'name@', 'email@', 'someone@', 'user@',
        'support@2x', 'support@3x', 'info@2x', 'info@3x',
        'example@example', 'test@test', 'demo@demo'
    ]

    if any(excl in email.lower() for excl in exclusions):
        return False

    return True


def save_emails_to_csv(
    emails_by_keyword: dict[str, list[dict | str]],
    output_file: str = "output/emails.csv",
) -> str:
    """
    Accepts either a list of plain e‑mail strings **or** a list of dicts that
    look like {"Email": "...", "Keyword Category": "..."} and always writes just
    the e‑mail string to the first column of the CSV.
    """
    file_exists = os.path.exists(output_file)

    mode = "a" if file_exists else "w"
    with open(output_file, mode, newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        if not file_exists:
            writer.writerow(["Email", "Keyword Category"])

        rows_added = 0
        for keyword, items in emails_by_keyword.items():
            for item in items:
                email = item["Email"] if isinstance(item, dict) else item
                writer.writerow([email, keyword])
                rows_added += 1

    log(f"Saved {rows_added} rows to {output_file}")
    return output_file


def format_search_query(keyword):
    """Format keyword into the specific search query pattern"""
    # Build query in the format: keyword+intext:@gmail.com+OR+intext:@yahoo.com+...
    email_domains = ['gmail.com', 'yahoo.com', 'hotmail.com']
    email_pattern = "+OR+".join([f"intext:@{domain}" for domain in email_domains])

    # Return the formatted query
    return f"{keyword}+{email_pattern}"

# This function is used by the FastAPI service to run the extraction process
def run_extraction(keyword, category, max_pages=5):
    """
    Run the extraction process for a single keyword and return the results
    
    Args:
        keyword (str): The keyword to search for
        category (str): The category to assign to found emails
        max_pages (int): Maximum number of search pages to process
        
    Returns:
        list: List of tuples (email, category)
    """
    log(f"Starting extraction for keyword: {keyword}")
    
    # Setup Chrome
    driver = setup_driver()
    if not driver:
        log("Failed to setup Chrome.")
        return []
    
    try:
        # Format the search query
        query = format_search_query(keyword)
        log(f"Using search query: {query}")
        
        # Search for URLs
        urls = search_google(driver, query, max_pages=max_pages)
        
        # Extract emails from each URL
        keyword_emails = set()
        for j, url in enumerate(urls, 1):
            log(f"Processing URL {j}/{len(urls)}")
            emails = extract_emails_from_url(url)
            
            # Add new emails to our list
            new_emails = [email for email in emails if email not in keyword_emails]
            keyword_emails.update(new_emails)
            
            if new_emails:
                log(f"Found {len(new_emails)} new emails. Total for keyword: {len(keyword_emails)}")
            
            # Wait between requests
            time.sleep(random.uniform(0.5, 1))
        
        # Return simple email strings and category (not dictionaries)
        email_category = category or keyword
        log(f"Completed extraction for keyword: {keyword}. Found {len(keyword_emails)} emails.")
        
        # Return as a list of tuples (email, category) instead of dictionaries
        return [{"Email": email, "Keyword Category": email_category} for email in keyword_emails]

    
    finally:
        # Clean up
        if driver:
            driver.quit()
            log("Chrome WebDriver closed")


# This function isn't needed for the integration but kept for reference
def main():
    """Main function for processing a list of keywords"""
    log("Starting Email Scraper for Multiple Keywords")

    # Get user input
    keywords_input = input("Enter keywords (comma-separated without spaces): ").strip()
    category = input("Enter category for these emails (or leave blank to use keywords as categories): ").strip()

    if not keywords_input:
        log("No keywords entered. Exiting.")
        return

    # Parse the comma-separated keywords
    keywords = [k.strip() for k in keywords_input.split(",") if k.strip()]
    log(f"Processing {len(keywords)} keywords: {', '.join(keywords)}")

    # Setup Chrome
    driver = setup_driver()
    if not driver:
        log("Failed to setup Chrome. Exiting.")
        return

    try:
        # Track all found emails by keyword
        emails_by_keyword = {}

        # Process each keyword
        for i, keyword in enumerate(keywords, 1):
            log(f"\nProcessing keyword {i}/{len(keywords)}: '{keyword}'")

            # Use keyword as category if no global category is provided
            current_category = category if category else keyword

            # Format the search query according to the specified pattern
            query = format_search_query(keyword)
            log(f"Using search query: {query}")

            # Search for URLs
            urls = search_google(driver, query, max_pages=10)  # Get up to 10 pages of results

            # Extract emails from each URL
            keyword_emails = set()
            for j, url in enumerate(urls, 1):
                log(f"Processing URL {j}/{len(urls)}")
                emails = extract_emails_from_url(url)

                # Add new emails to our list
                new_emails = [email for email in emails if email not in keyword_emails]
                keyword_emails.update(new_emails)

                if new_emails:
                    log(f"Found {len(new_emails)} new emails. Total for keyword: {len(keyword_emails)}")

                # Save intermediate results after every few URLs
                if j % 5 == 0 or j == len(urls):
                    emails_by_keyword[current_category] = list(keyword_emails)
                    output_file = save_emails_to_csv(emails_by_keyword)
                    log(f"Intermediate save: {output_file}")

                # Wait between requests
                time.sleep(random.uniform(1, 2))

            # Update the overall results dictionary
            emails_by_keyword[current_category] = list(keyword_emails)

            # Save intermediate results after each keyword
            output_file = save_emails_to_csv(emails_by_keyword)
            log(f"Keyword completed. Results saved to: {output_file}")

            # Wait between keywords
            time.sleep(random.uniform(3, 5))

        # Calculate total emails found
        total_emails = sum(len(emails) for emails in emails_by_keyword.values())
        log(f"\nScraping completed. Found {total_emails} emails across {len(keywords)} keywords.")

        # Print summary by keyword/category
        log("\nEmails found by category:")
        for cat, emails in emails_by_keyword.items():
            log(f"- {cat}: {len(emails)} emails")

    except Exception as e:
        log(f"Error in main scraping process: {str(e)}")
    finally:
        # Clean up
        driver.quit()
        log("Chrome WebDriver closed")


if __name__ == "__main__":
    main()