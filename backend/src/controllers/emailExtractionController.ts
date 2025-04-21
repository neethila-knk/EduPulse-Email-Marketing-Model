import { Request, Response } from "express";
import axios from 'axios';
import ExtractedEmail from '../models/extractedEmail';
import 'dotenv/config';

// FastAPI URL from environment variables
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// Define interfaces for the API responses
interface ExtractionResponse {
  job_id: string;
  message: string;
  status: string;
}

interface ExtractionStatusResponse {
  job_id: string;
  status: string;
  progress: number;
  total_emails: number;
  keywords_processed: number;
  total_keywords: number;
  completed: boolean;
  error?: string;
}

interface EmailResult {
  Email?: string;
  email?: string;
  'Keyword Category'?: string;
  category?: string;
}

interface ExtractionResultsResponse {
  job_id: string;
  total_emails: number;
  results: EmailResult[];
  download_url: string;
}

/**
 * Start an email extraction job
 */
export async function startExtraction(req: Request, res: Response): Promise<void> {
  try {
    const { keywords, category, max_pages = 5 } = req.body;
    
    // Validate input
    if (!keywords || !keywords.trim()) {
      res.status(400).json({
        message: "Keywords are required",
        errors: {
          keywords: "Please provide at least one keyword"
        }
      });
      return;
    }
    
    // Call the FastAPI endpoint
    const response = await axios.post<ExtractionResponse>(`${FASTAPI_URL}/extract-emails`, {
      keywords,
      category: category || "",
      max_pages: max_pages
    });
    
    res.status(201).json({
      message: "Email extraction job started",
      job_id: response.data.job_id,
      status: response.data.status
    });
  } catch (error: any) {
    console.error("Email extraction error:", error);
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status).json({
        message: "Error from extraction service",
        error: error.response.data.detail || error.response.data.message || "Unknown error"
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(503).json({
        message: "Email extraction service unavailable",
        error: "Could not connect to extraction service"
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      res.status(500).json({
        message: "An error occurred while starting email extraction",
        error: error.message
      });
    }
  }
}

/**
 * Check the status of an extraction job
 */
export async function getExtractionStatus(req: Request, res: Response): Promise<void> {
  try {
    const { jobId } = req.params;
    
    // Call the FastAPI endpoint
    const response = await axios.get<ExtractionStatusResponse>(`${FASTAPI_URL}/extraction-status/${jobId}`);
    
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Error checking extraction status:", error);
    
    if (error.response && error.response.status === 404) {
      res.status(404).json({
        message: "Job not found",
        error: "The specified job ID was not found"
      });
    } else {
      res.status(500).json({
        message: "An error occurred while checking extraction status",
        error: error.message || "Unknown error"
      });
    }
  }
}

/**
 * Get the results of an extraction job
 */
export async function getExtractionResults(req: Request, res: Response): Promise<void> {
  try {
    const { jobId } = req.params;
    
    // Call the FastAPI endpoint
    const response = await axios.get<ExtractionResultsResponse>(`${FASTAPI_URL}/extraction-results/${jobId}`);
    
    // Save results to DB if job is completed and has results
    if (response.data.results && response.data.results.length > 0) {
      try {
        // Process and save emails to database in the background
        saveEmailsToDatabase(response.data.results, jobId).catch(err => 
          console.error("Error saving extraction results to database:", err)
        );
      } catch (dbError) {
        console.error("Error preparing database save:", dbError);
        // Continue and return results even if DB save fails
      }
    }
    
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Error getting extraction results:", error);
    
    if (error.response) {
      res.status(error.response.status).json({
        message: "Error retrieving extraction results",
        error: error.response.data.detail || error.response.data.message || "Unknown error"
      });
    } else {
      res.status(500).json({
        message: "An error occurred while retrieving extraction results",
        error: error.message || "Unknown error"
      });
    }
  }
}

/**
 * Download extraction results as CSV
 */
export async function downloadExtractionResults(req: Request, res: Response): Promise<void> {
  try {
    const { jobId } = req.params;
    
    // Get the file URL from FastAPI
    const fileUrl = `${FASTAPI_URL}/download-emails/${jobId}`;
    
    // Stream the file to the client
    const response = await axios<NodeJS.ReadableStream>({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream'
    });
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="extracted_emails_${new Date().toISOString().slice(0, 10)}.csv"`);
    
    // Pipe the response stream to the client
    response.data.pipe(res);
  } catch (error: any) {
    console.error("Error downloading extraction results:", error);
    
    if (error.response) {
      res.status(error.response.status).json({
        message: "Error downloading results",
        error: error.response.data.detail || error.response.data.message || "Unknown error"
      });
    } else {
      res.status(500).json({
        message: "An error occurred while downloading results",
        error: error.message || "Unknown error"
      });
    }
  }
}

/**
 * Helper function to save emails to the database
 */
async function saveEmailsToDatabase(results: EmailResult[], jobId: string): Promise<void> {
  // Process each result one by one to avoid type issues with bulk operations
  const savedCount = await Promise.all(
    results.map(async (result) => {
      const email = result.Email || result.email;
      if (!email) return false;
      
      const category = result['Keyword Category'] || result.category || 'imported';
      const domain = email.split('@')[1] || 'unknown';
      
      try {
        // Use findOneAndUpdate instead of bulkWrite to avoid type issues
        await ExtractedEmail.findOneAndUpdate(
          { email: email.toLowerCase() },
          {
            email: email.toLowerCase(),
            category: category,
            domain: domain,
            job_id: jobId,
            extracted_at: new Date()
          },
          { upsert: true, new: true }
        );
        return true;
      } catch (err) {
        console.error(`Error saving email ${email}:`, err);
        return false;
      }
    })
  );
  
  const successCount = savedCount.filter(Boolean).length;
  console.log(`Saved ${successCount} emails to database from job ${jobId}`);
}