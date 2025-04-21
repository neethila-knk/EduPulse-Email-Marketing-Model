// routes/jobUpdateEndpoint.ts
import express, { Request, Response } from 'express';
import EmailExtractionJob from '../models/extractedEmail';
import mongoose from 'mongoose';

const router = express.Router();

// This endpoint will be called by the FastAPI service to update job status
router.post('/update-job/:jobId', async (req: Request, res: Response) :Promise<void> => {
  try {
    const { jobId } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      res.status(400).json({ message: 'Invalid job ID' });
      return;
    }
    
    // Log the update for debugging
    console.log(`Updating job ${jobId} with status: ${updateData.status}, progress: ${updateData.progress}%`);
    
    // Update job in MongoDB
    const updatedJob = await EmailExtractionJob.findByIdAndUpdate(
      jobId,
      { $set: updateData },
      { new: true }
    );
    
    if (!updatedJob) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    
    res.status(200).json({ 
      message: 'Job updated successfully',
      job: {
        _id: updatedJob._id,
        status: updatedJob.status,
        progress: updatedJob.progress,
        total_emails: updatedJob.total_emails,
        keywords_processed: updatedJob.keywords_processed
      }
    });
    return;
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Failed to update job status' });
    return;
  }
});

export default router;