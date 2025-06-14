import express, { Request, Response } from 'express';
import axios from 'axios';
import { authenticateAdminJWT } from '../middleware/adminAuthMiddleware'; 

import EmailExtractionJob from '../models/extractedEmail';
import mongoose from 'mongoose';

const router = express.Router();


const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';


interface ExtractionRequest {
  keywords: string;
  category?: string;
  max_pages?: number;
}

interface EmailResult {
  Email: string;
  'Keyword Category': string;
}


router.post('/extract-emails', authenticateAdminJWT, async (req: Request, res: Response) :Promise<void> =>{
  try {
    const { keywords, category, max_pages } = req.body as ExtractionRequest;

    if (!keywords || !keywords.trim()) {
      res.status(400).json({ message: 'Keywords are required' });
      return;
    }

   
    const job = new EmailExtractionJob({
      keywords,
      category: category || '',
      max_pages: max_pages || 5,
      status: 'queued',
      progress: 0,
      keywords_processed: 0,
      total_keywords: keywords.split(',').length,
      user: (req as any).user._id 
    });

    await job.save();


    axios.post(`${FASTAPI_URL}/api/email-extraction/start-job`, {
      job_id: job._id.toString(),
      keywords,
      category: category || '',
      max_pages: max_pages || 5
    }).catch((error: Error) => {
      console.error('Error communicating with FastAPI service:', error);
    
      job.status = 'failed';
      job.error = 'Failed to start extraction service';
      job.save();
    });

    res.status(201).json({
      job_id: job._id,
      message: 'Email extraction job started',
      status: job.status
    });
    return;
  } catch (error) {
    console.error('Error starting email extraction:', error);
     res.status(500).json({ message: 'Internal server error' });
     return;
  }
});


router.get('/extraction-status/:jobId', authenticateAdminJWT, async (req: Request, res: Response) :Promise<void> => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      res.status(400).json({ message: 'Invalid job ID' });
      return;
    }

    const job = await EmailExtractionJob.findById(jobId);

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }


    res.json({
      job_id: job._id,
      status: job.status,
      progress: job.progress,
      total_emails: job.total_emails,
      keywords_processed: job.keywords_processed,
      total_keywords: job.total_keywords,
      completed: ['completed', 'failed'].includes(job.status),
      error: job.error
    });
    return;
  } catch (error) {
    console.error('Error getting extraction status:', error);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
});


router.get('/extraction-results/:jobId', authenticateAdminJWT, async (req: Request, res: Response):Promise<void> => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      res.status(400).json({ message: 'Invalid job ID' });
      return;
    }

    const job = await EmailExtractionJob.findById(jobId);

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

  
    if (job.status !== 'completed') {
      res.status(400).json({ 
        message: 'Extraction not complete', 
        status: job.status 
      });
      return;
    }


    res.json({
      job_id: job._id,
      total_emails: job.total_emails,
      results: job.results || [],
      download_url: `/api/email-extraction/download-emails/${job._id}`
    });
    return;
  } catch (error) {
    console.error('Error getting extraction results:', error);
    res.status(500).json({ message: 'Internal server error' });
    return;
  }
});


router.get('/download-emails/:jobId', authenticateAdminJWT, async (req: Request, res: Response) : Promise<void> => {
    try {
      const { jobId } = req.params;
      console.log(`Download request received for job ID: ${jobId}`);
  
      if (!mongoose.Types.ObjectId.isValid(jobId)) {
        res.status(400).json({ message: 'Invalid job ID format' });
        return;
      }
  
      const job = await EmailExtractionJob.findById(jobId);
  
      if (!job) {
        res.status(404).json({ message: 'Job not found' });
        return;
      }
  
     
      if (job.status !== 'completed') {
        res.status(400).json({ message: 'Extraction not complete' });
        return;
      }
  
  
      if (!job.results || job.results.length === 0) {
        res.status(404).json({ message: 'No results available for download' });
        return;
      }
  
      console.log(`Generating CSV for job: ${jobId} with ${job.results.length} results`);
  
    
      let csvContent = 'Email,Keyword Category\n';
      
 
      job.results.forEach((result: any) => {

        let email = '';
        let category = '';
        
        if (typeof result === 'object' && result !== null) {
          
          email = result.Email || '';
          category = result['Keyword Category'] || '';
        } else if (typeof result === 'string') {
         
          try {
       
            const resultString: string = result;
            const parsed = JSON.parse(resultString.replace(/'/g, '"'));
            email = parsed.Email || '';
            category = parsed['Keyword Category'] || '';
          } catch (e) {
            
            const tupleMatch = result.match(/\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/);
            if (tupleMatch) {
              email = tupleMatch[1];
              category = tupleMatch[2];
            } else {
             
              email = result;
            }
          }
        }
        
       
        if (email) {
   
          const escapedEmail = email.replace(/"/g, '""');
          const escapedCategory = (category || '').replace(/"/g, '""');
          csvContent += `"${escapedEmail}","${escapedCategory}"\n`;
        }
      });
  
   
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="extracted_emails_${jobId}.csv"`);
      
      
       res.send(csvContent);
       return;
    } catch (error) {
      console.error('Error downloading emails:', error);
      res.status(500).json({ message: 'Internal server error' });
      return;
    }
  });

export default router;