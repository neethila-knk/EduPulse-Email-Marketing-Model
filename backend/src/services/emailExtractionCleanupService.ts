// services/emailExtractionCleanupService.ts
import EmailExtractionJob from '../models/extractedEmail';

/**
 * Service to clean up stale email extraction jobs
 * This will mark jobs as failed if they've been in processing state for too long
 */
export const cleanupStalledJobs = async (): Promise<void> => {
  try {
    console.log('Running email extraction job cleanup service...');
    
    // Find jobs that have been processing for more than 30 minutes
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
    
    // Find jobs that are in processing state but haven't been updated recently
    const stalledJobs = await EmailExtractionJob.find({
      status: { $in: ['queued', 'starting', 'processing'] },
      updatedAt: { $lt: thirtyMinutesAgo }
    });
    
    if (stalledJobs.length > 0) {
      console.log(`Found ${stalledJobs.length} stalled email extraction jobs to clean up`);
      
      // Update all stalled jobs to failed status
      const updatePromises = stalledJobs.map(job => 
        EmailExtractionJob.findByIdAndUpdate(
          job._id,
          {
            $set: {
              status: 'failed',
              error: 'Job timed out after 30 minutes of inactivity'
            }
          }
        )
      );
      
      await Promise.all(updatePromises);
      console.log('Successfully cleaned up stalled jobs');
    } else {
      console.log('No stalled jobs found');
    }
  } catch (error) {
    console.error('Error cleaning up stalled email extraction jobs:', error);
  }
};

// Setup a periodic cleanup task
export const setupJobCleanupTask = (): NodeJS.Timeout => {
  // Run cleanup every 15 minutes
  return setInterval(cleanupStalledJobs, 15 * 60 * 1000);
};

// Export a function to initialize the cleanup service
export const initEmailExtractionCleanup = (): void => {
  console.log('Initializing email extraction job cleanup service');
  
  // Run an initial cleanup
  cleanupStalledJobs();
  
  // Schedule regular cleanups
  const intervalId = setupJobCleanupTask();
  
  // Handle process termination
  process.on('SIGTERM', () => {
    clearInterval(intervalId);
    console.log('Email extraction job cleanup service stopped');
  });
  
  console.log('Email extraction job cleanup service initialized');
};

export default {
  cleanupStalledJobs,
  setupJobCleanupTask,
  initEmailExtractionCleanup
};