import EmailExtractionJob from "../models/extractedEmail";

export const cleanupStalledJobs = async (): Promise<void> => {
  try {
    console.log("Running email extraction job cleanup service...");

    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    const stalledJobs = await EmailExtractionJob.find({
      status: { $in: ["queued", "starting", "processing"] },
      updatedAt: { $lt: thirtyMinutesAgo },
    });

    if (stalledJobs.length > 0) {
      console.log(
        `Found ${stalledJobs.length} stalled email extraction jobs to clean up`
      );

      const updatePromises = stalledJobs.map((job) =>
        EmailExtractionJob.findByIdAndUpdate(job._id, {
          $set: {
            status: "failed",
            error: "Job timed out after 30 minutes of inactivity",
          },
        })
      );

      await Promise.all(updatePromises);
      console.log("Successfully cleaned up stalled jobs");
    } else {
      console.log("No stalled jobs found");
    }
  } catch (error) {
    console.error("Error cleaning up stalled email extraction jobs:", error);
  }
};

export const setupJobCleanupTask = (): NodeJS.Timeout => {
  return setInterval(cleanupStalledJobs, 15 * 60 * 1000);
};

export const initEmailExtractionCleanup = (): void => {
  console.log("Initializing email extraction job cleanup service");

  // Run an initial cleanup
  cleanupStalledJobs();

  // Schedule regular cleanups
  const intervalId = setupJobCleanupTask();

  // Handle process termination
  process.on("SIGTERM", () => {
    clearInterval(intervalId);
    console.log("Email extraction job cleanup service stopped");
  });

  console.log("Email extraction job cleanup service initialized");
};

export default {
  cleanupStalledJobs,
  setupJobCleanupTask,
  initEmailExtractionCleanup,
};
