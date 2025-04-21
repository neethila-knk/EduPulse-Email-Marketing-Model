from fastapi import APIRouter, HTTPException, Body, BackgroundTasks
from pydantic import BaseModel
import traceback
import logging
import subprocess
import sys
import os
import csv
import time
from typing import List, Dict, Any, Optional
import requests
import json
from email_scraper import run_extraction, save_emails_to_csv
# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("email-scraper")

# Define the router
router = APIRouter()

# MongoDB update URL
EXPRESS_API_URL = os.environ.get("EXPRESS_API_URL", "http://localhost:5000")

# Define request models
class ExtractEmailsRequest(BaseModel):
    job_id: str
    keywords: str
    category: str = ""
    max_pages: int = 5

class JobUpdateModel(BaseModel):
    status: str
    progress: float
    keywords_processed: int
    total_keywords: int
    total_emails: int = 0
    error: Optional[str] = None
    results: Optional[List[Dict[str, str]]] = None


# Function to update job status in MongoDB via Express API
def update_job_status(job_id: str, update_data: JobUpdateModel):
    try:
        url = f"{EXPRESS_API_URL}/api/email-extraction/update-job/{job_id}"
        response = requests.post(
            url, 
            json=update_data.dict(exclude_none=True),
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            logger.error(f"Failed to update job status: {response.text}")
            return False
        
        logger.info(f"Successfully updated job {job_id} with status {update_data.status}")
        return True
    
    except Exception as e:
        logger.error(f"Error updating job status: {str(e)}")
        return False


# Function to run the email scraper script for each keyword
def run_email_scraper(job_id: str, keywords: str, category: str, max_pages: int) -> None:
    """
    Background task launched from /start-job.
    • Iterates over the provided keywords
    • Calls email_scraper.run_extraction for each keyword
    • Updates job status in the Express API
    • Stores *clean* results (plain e‑mail strings) in MongoDB
    """
    try:
        # 1️⃣  Validate & parse keywords
        keyword_list = [k.strip() for k in keywords.split(",") if k.strip()]
        total_keywords = len(keyword_list)

        if total_keywords == 0:
            update_job_status(
                job_id,
                JobUpdateModel(
                    status="failed",
                    progress=0,
                    keywords_processed=0,
                    total_keywords=0,
                    error="No valid keywords provided",
                ),
            )
            return

        # 2️⃣  Mark job as starting
        update_job_status(
            job_id,
            JobUpdateModel(
                status="starting",
                progress=0,
                keywords_processed=0,
                total_keywords=total_keywords,
            ),
        )

        # 3️⃣  Prepare result holders
        emails_by_keyword: dict[str, list[dict[str, str]]] = {}
        all_emails: list[dict[str, str]] = []

        # 4️⃣  Loop through each keyword
        for i, keyword in enumerate(keyword_list, start=1):
            update_job_status(
                job_id,
                JobUpdateModel(
                    status=f"processing_keyword_{i}",
                    progress=((i - 1) / total_keywords) * 100,
                    keywords_processed=i - 1,
                    total_keywords=total_keywords,
                    total_emails=len(all_emails),
                ),
            )

            current_category = category if category else keyword

            # 👉  Call the extractor (does its own WebDriver work)
            keyword_results = run_extraction(
                keyword=keyword,
                category=current_category,
                max_pages=max_pages,
            )

            # Collect results
            all_emails.extend(keyword_results)
            emails_by_keyword.setdefault(current_category, []).extend(keyword_results)

            # Optional CSV snapshot for manual download / debugging
            output_file = f"output/emails_{job_id}.csv"
            save_emails_to_csv(emails_by_keyword, output_file)

            # Update status after finishing this keyword
            update_job_status(
                job_id,
                JobUpdateModel(
                    status=f"completed_keyword_{i}",
                    progress=(i / total_keywords) * 100,
                    keywords_processed=i,
                    total_keywords=total_keywords,
                    total_emails=len(all_emails),
                ),
            )

        # 5️⃣  Final “completed” update with the clean result array
        update_job_status(
            job_id,
            JobUpdateModel(
                status="completed",
                progress=100,
                keywords_processed=total_keywords,
                total_keywords=total_keywords,
                total_emails=len(all_emails),
                results=all_emails,  # ← plain e‑mail strings now
            ),
        )

        logger.info(
            "Email extraction completed for job %s – %d e‑mails found",
            job_id,
            len(all_emails),
        )

    except Exception as e:
        logger.error("Email extraction failed: %s", e, exc_info=True)
        update_job_status(
            job_id,
            JobUpdateModel(
                status="failed",
                progress=0,
                keywords_processed=0,
                total_keywords=len(keyword_list) if "keyword_list" in locals() else 0,
                error=str(e),
            ),
        )


# Endpoint to start a new extraction job
@router.post("/start-job")
async def start_extraction_job(background_tasks: BackgroundTasks, request: ExtractEmailsRequest = Body(...)):
    """
    Start an email extraction job in the background.
    This endpoint is called by the Express backend after creating a job in MongoDB.
    """
    try:
          # This will be implemented to call your email scraper
        print(f"Starting extraction job {request.job_id} with keywords: {request.keywords}")
        logger.info(f"Received request to start email extraction job {request.job_id}")
        
        # Add task to background tasks
        background_tasks.add_task(
            run_email_scraper,
            request.job_id,
            request.keywords,
            request.category,
            request.max_pages
        )
        
        return {"message": "Email extraction started in background", "job_id": request.job_id}
    
    except Exception as e:
        
        logger.error(f"Error starting email extraction: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to start extraction: {str(e)}")


# Endpoint for Express backend to update job status (create a webhook)
@router.post("/update-express-job/{job_id}")
async def update_express_job(job_id: str, update_data: JobUpdateModel):
    """Webhook for FastAPI to update job status in Express backend"""
    try:
        success = update_job_status(job_id, update_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update job in Express backend")
        return {"message": "Job status updated successfully"}
    
    except Exception as e:
        logger.error(f"Error updating Express job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating job: {str(e)}")