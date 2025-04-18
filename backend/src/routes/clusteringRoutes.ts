import express, { Request, Response } from "express";
import multer from "multer";
import axios from "axios";
import fs from "fs";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import FormData from "form-data";
import csv from "csv-parser";
import {
  getPerformanceMetrics,
  compareAlgorithms,
  getPipelineMetrics,
  storePipelineMetrics,
} from "../controllers/performanceMetricsController";

dotenv.config();
const router = express.Router();
const upload = multer({ dest: "uploads/" });

const mongoUri = process.env.MONGO_URI!;
const client = new MongoClient(mongoUri);
const db = client.db("edudb");
const emailCollection = db.collection("clustered_emails");
const visualizationCollection = db.collection("visualizations");
const clusterCollection = db.collection("clusters");
const universityCollection = db.collection("university_clusters");

// Helper function to create a dataset record
async function createDatasetRecord(
  fileName: string,
  totalEmails: number,
  newEmails: number
) {
  try {
    const dataset = {
      fileName,
      totalEmails,
      newEmails,
      processedAt: new Date(),
      status: "completed",
    };

    const result = await db.collection("datasets").insertOne(dataset);
    return result.insertedId;
  } catch (error) {
    console.error("Error creating dataset record:", error);
    return null;
  }
}

// Function to extract emails from CSV file
function extractEmailsFromCSV(
  filePath: string
): Promise<{ emails: string[]; records: any[] }> {
  return new Promise((resolve, reject) => {
    const emails: string[] = [];
    const records: any[] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: { Email: string }) => {
        if (data.Email) {
          emails.push(data.Email.toLowerCase().trim());
          records.push(data);
        }
      })
      .on("end", () => {
        resolve({ emails, records });
      })
      .on("error", (error: Error) => {
        reject(error);
      });
  });
}

// Function to filter out existing emails
async function filterExistingEmails(csvRecords: any[]): Promise<{
  newRecords: any[];
  existingCount: number;
  existingEmails: string[];
}> {
  // Get ALL emails from the database first
  const allExistingEmails = await emailCollection
    .find({}, { projection: { _id: 0, Email: 1 } })
    .toArray();

  // Create a set of normalized emails with aggressive cleaning
  const existingEmailsSet = new Set<string>();
  for (const doc of allExistingEmails) {
    // Super aggressive normalization
    const normalizedEmail = doc.Email.toLowerCase()
      .trim()
      .normalize("NFKC") // Normalize Unicode
      .replace(/\s+/g, ""); // Remove ALL whitespace
    existingEmailsSet.add(normalizedEmail);
  }

  console.log(`Total emails in database: ${existingEmailsSet.size}`);

  // Find which emails are considered "new"
  const newRecords: any[] = [];
  const debugInfo: any[] = [];

  for (const record of csvRecords) {
    // Apply the same aggressive normalization
    const normalizedEmail = record.Email.toLowerCase()
      .trim()
      .normalize("NFKC")
      .replace(/\s+/g, "");

    if (!existingEmailsSet.has(normalizedEmail)) {
      newRecords.push(record);

      // Log detailed information about the "new" email for debugging
      debugInfo.push({
        original: record.Email,
        normalized: normalizedEmail,
        charCodes: [...record.Email].map((c) => c.charCodeAt(0)),
      });
    }
  }

  // Log the problematic emails
  if (newRecords.length > 0) {
    console.log("Emails detected as new that should be existing:");
    console.log(JSON.stringify(debugInfo, null, 2));
  }

  // Fix for the second error: properly type the Array.from conversion
  const existingEmails: string[] = Array.from(existingEmailsSet.values());

  return {
    newRecords,
    existingCount: existingEmailsSet.size,
    existingEmails,
  };
}

// Function to save CSV with only new records
async function saveFilteredCSV(
  records: any[],
  filePath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (records.length === 0) {
      reject(new Error("No new records to process"));
      return;
    }

    const newFilePath = `${filePath}_filtered`;
    const headers = Object.keys(records[0]).join(",") + "\n";

    // Write headers
    fs.writeFileSync(newFilePath, headers);

    // Write each record
    records.forEach((record) => {
      const row = Object.values(record)
        .map((val) =>
          typeof val === "string" && val.includes(",") ? `"${val}"` : val
        )
        .join(",");

      fs.appendFileSync(newFilePath, row + "\n");
    });

    resolve(newFilePath);
  });
}

// Modified route to handle new upload approach
router.post(
  "/cluster-emails",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded." });
      return;
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    let filteredFilePath: string | null = null;

    try {
      console.log(`Processing uploaded file: ${fileName}`);

      const { records: csvRecords } = await extractEmailsFromCSV(filePath);
      console.log(`Extracted ${csvRecords.length} records from CSV`);

      const { newRecords, existingCount } = await filterExistingEmails(
        csvRecords
      );
      console.log(
        `Found ${existingCount} existing emails, ${newRecords.length} new emails`
      );

      if (newRecords.length === 0) {
        res.json({
          status: "warning",
          message:
            "All emails in this file already exist in the database. No new data to process.",
          inserted: 0,
          existing: existingCount,
        });
        return;
      }

      filteredFilePath = await saveFilteredCSV(newRecords, filePath);

      const formData = new FormData();
      formData.append("file", fs.createReadStream(filteredFilePath), {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const datasetId = await createDatasetRecord(
        fileName,
        csvRecords.length,
        newRecords.length
      );
      if (!datasetId) {
        throw new Error("Failed to create dataset record");
      }

      interface ClusteringResponse {
        records: any[];
        visualization_data?: any;
        cluster_analysis?: any;
        metrics?: any;
        tsne_data?: any;
      }

      const response = await axios.post<ClusteringResponse>(
        "http://localhost:8000/cluster",
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 300000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        } as any
      );

      const { records, visualization_data, cluster_analysis, metrics } =
        response.data as ClusteringResponse;
      const extractedTSNEData = records
        .filter((r) => r.x !== undefined && r.y !== undefined)
        .map((r) => ({
          x: r.x,
          y: r.y,
          z: r.z || 1,
          cluster_name: r.cluster_name || `Cluster ${r.stage2_cluster || 0}`,
          university_name: r.university_name || null,
        }));

      const fixedVisualizationData = {
        ...(visualization_data || {}),
        tsne_data: extractedTSNEData.length > 0 ? extractedTSNEData : null,
      };

      if (visualization_data) {
        await visualizationCollection.insertOne({
          datasetId,
          data: fixedVisualizationData,
          createdAt: new Date(),
          isIncremental: true,
          newRecordsCount: newRecords.length,
        });
      }

      const clusterData: any[] = [];

      if (cluster_analysis && cluster_analysis.cluster_names) {
        const clusterNames = cluster_analysis.cluster_names;
        const clusterMetadata = cluster_analysis.cluster_metadata || {};

        for (const [clusterId, originalName] of Object.entries(clusterNames)) {
          const clusterMetadataObj = clusterMetadata[clusterId] || {};

          const clusterRecords = records.filter(
            (r: { stage2_cluster: string | number }) =>
              String(r.stage2_cluster) === String(clusterId)
          );

          const clusterEmailCount = clusterRecords.length;
          const emailsForCluster = clusterRecords.map(
            (r: { Email: string }) => r.Email
          );

          const todayStr = new Date().toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          const enhancedName = `${originalName} (Added ${todayStr})`;

          const domainDist: Record<string, number> = {};
          const keywordDist: Record<string, number> = {};

          clusterRecords.forEach(
            (record: { domain_type?: string; "Keyword Category"?: string }) => {
              if (record.domain_type) {
                domainDist[record.domain_type] =
                  (domainDist[record.domain_type] || 0) + 1;
              }
              if (record["Keyword Category"]) {
                keywordDist[record["Keyword Category"]] =
                  (keywordDist[record["Keyword Category"]] || 0) + 1;
              }
            }
          );

          clusterData.push({
            datasetId,
            cluster_id: parseInt(clusterId),
            name: enhancedName,
            size: clusterEmailCount,
            description: `${
              clusterMetadataObj.audience_description || `Cluster ${clusterId}`
            } (new import)`,
            engagement_potential:
              clusterMetadataObj.engagement_potential || "Unknown",
            size_classification:
              clusterMetadataObj.size_classification || "Unknown",
            primary_domain_type:
              clusterMetadataObj.primary_domain_type || "Unknown",
            primary_interest: clusterMetadataObj.primary_interest || "Unknown",
            top_universities: clusterMetadataObj.top_universities || {},
            domain_distribution: domainDist,
            keyword_distribution: keywordDist,
            emails: emailsForCluster,
            createdAt: new Date(),
            isNewImport: true,
            status: "active",
          });
        }

        if (clusterData.length > 0) {
          await clusterCollection.insertMany(clusterData);
        }
      }

      const enhancedRecords = records.map(
        (r: { [key: string]: any; cluster_name: string }) => ({
          ...r,
          datasetId,
          addedDate: new Date(),
        })
      );

      if (enhancedRecords.length > 0) {
        await emailCollection.insertMany(enhancedRecords);
        console.log(
          `Inserted ${enhancedRecords.length} email records into database`
        );
      }

      // ✅ Reinsert university cluster logic
      let universityDataInserted = false;

      if (
        cluster_analysis &&
        cluster_analysis.university_clusters &&
        Array.isArray(cluster_analysis.university_clusters) &&
        cluster_analysis.university_clusters.length > 0
      ) {
        const universityClusters = cluster_analysis.university_clusters.map(
          (uc: any) => ({
            ...uc,
            datasetId,
            createdAt: new Date(),
            isNewImport: true,
          })
        );

        await universityCollection.insertMany(universityClusters);
        universityDataInserted = true;
        console.log("Inserted university clusters from clustering output.");
      }

      if (!universityDataInserted) {
        const universityEmails = new Map<
          string,
          { count: number; domains: Set<string> }
        >();

        for (const record of records) {
          if (
            record.university_name &&
            record.university_name !== "None" &&
            record.university_name !== "Unknown"
          ) {
            const universityName = record.university_name;
            const domain =
              record.domain ||
              (record.Email ? record.Email.split("@")[1] : null);

            if (!universityEmails.has(universityName)) {
              universityEmails.set(universityName, {
                count: 0,
                domains: new Set<string>(),
              });
            }

            const uniData = universityEmails.get(universityName)!;
            uniData.count++;
            if (domain) uniData.domains.add(domain);
          }
        }

        const extractedUniversityClusters = Array.from(
          universityEmails.entries()
        ).map(([university, data]) => ({
          university,
          count: data.count,
          sample:
            data.domains.size > 0 ? Array.from(data.domains)[0] : "unknown",
          datasetId,
          createdAt: new Date(),
          isNewImport: true,
          extractedDirectly: true,
        }));

        if (extractedUniversityClusters.length > 0) {
          await universityCollection.insertMany(extractedUniversityClusters);
          console.log(
            `Inserted ${extractedUniversityClusters.length} university clusters from records`
          );
        } else {
          console.log(
            "No university clusters extracted from in-memory records."
          );
        }
      }

      const uniqueClusters = new Set(
        enhancedRecords.map((record) => record.cluster_name)
      );

      res.json({
        status: "success",
        inserted: enhancedRecords.length,
        existing: existingCount,
        clusters: uniqueClusters.size,
        datasetId,
        message: `Successfully added ${enhancedRecords.length} new emails to ${uniqueClusters.size} audience segments. ${existingCount} emails were already in the database.`,
      });
    } catch (error) {
      console.error(
        "Error during clustering:",
        error instanceof Error ? error.message : error
      );
      res.status(500).json({
        error: "Clustering failed. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      for (const path of [filePath, filteredFilePath]) {
        if (path && fs.existsSync(path)) {
          fs.unlinkSync(path);
          console.log(`Removed temporary file: ${path}`);
        }
      }
    }
  }
);

router.get("/available-clusters", async (_req: Request, res: Response) => {
  try {
    const result = await clusterCollection.find().toArray();

    if (result.length === 0) {
      // Fallback to old method of aggregation if no explicit clusters exist
      const oldResult = await emailCollection
        .aggregate([
          {
            $group: {
              _id: "$cluster_name",
              count: { $sum: 1 },
              // Get a representative email for debugging purposes
              sampleEmail: { $first: "$Email" },
            },
          },
          { $sort: { count: -1 } },
        ])
        .toArray();

      // Transform to the expected format
      const clusters = oldResult.map((r) => ({
        name: r._id,
        count: r.count,
        // Include sample data for admin debugging
        sample: r.sampleEmail ? r.sampleEmail.split("@")[1] : "unknown",
      }));

      res.json(clusters);
      return;
    }

    // Transform to the expected format
    const clusters = result.map((cluster) => ({
      name: cluster.name,
      count: cluster.size,
      id: cluster._id,
      cluster_id: cluster.cluster_id,

      emails: cluster.emails || [], // 👈 include this
      status: cluster.status || "active",
      // Get domain distribution as a string for display
      sample: Object.keys(cluster.domain_distribution || {})[0] || "mixed",
    }));

    res.json(clusters);
    return;
  } catch (error) {
    console.error("Error fetching clusters:", error);
    res.status(500).json({ error: "Unable to fetch clusters." });
    return;
  }
});

router.get(
  "/available-university-clusters",
  async (_req: Request, res: Response) => {
    try {
      const result = await universityCollection.find().toArray();

      if (result.length === 0) {
        // Return empty array if no university clusters exist
        res.json([]);
        return;
      }

      // Transform if needed
      const universityClusters = result.map((uc) => ({
        university: uc.university,
        count: uc.count,
        sample: uc.sample,
      }));

      res.json(universityClusters);
      return;
    } catch (error) {
      console.error("Error fetching university clusters:", error);
      res.status(500).json({ error: "Unable to fetch university clusters." });
      return;
    }
  }
);

// Modified API endpoint to fix cluster email retrieval
router.get(
  "/cluster-emails/:cluster_name",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const clusterName = req.params.cluster_name;
      console.log(`Fetching emails for cluster: ${clusterName}`);

      // First, find the cluster in the clusters collection to get the cluster_id
      const clusterInfo = await clusterCollection.findOne({
        name: clusterName,
      });

      console.log(
        "Cluster info:",
        clusterInfo
          ? `Found cluster with ID ${clusterInfo.cluster_id}`
          : "Cluster not found in collection"
      );

      let query = {};

      if (clusterInfo) {
        // If we found the cluster, use its ID for the query
        query = {
          $or: [
            { cluster_id: clusterInfo.cluster_id },
            { stage2_cluster: clusterInfo.cluster_id },
            { cluster_name: clusterName },
            { stage2_cluster_name: clusterName },
          ],
        };
      } else {
        // Fall back to just using the name
        query = {
          $or: [
            { cluster_name: clusterName },
            { stage2_cluster_name: clusterName },
          ],
        };
      }

      console.log("Query:", JSON.stringify(query));

      // Try to find emails for this cluster
      const emails = await emailCollection
        .find(query, {
          projection: {
            Email: 1,
            domain_type: 1,
            Keyword_Category: 1,
            university_name: 1,
            _id: 0,
          },
        })
        .toArray();

      console.log(`Found ${emails.length} emails for cluster ${clusterName}`);

      // Even if we find 0 emails, return an empty array
      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res
        .status(500)
        .json({ error: "Unable to fetch emails for this cluster." });
    }
  }
);

router.get("/cluster-stats", async (_req: Request, res: Response) => {
  try {
    const totalEmails = await emailCollection.countDocuments();
    const domainTypeCounts = await emailCollection
      .aggregate([
        { $group: { _id: "$domain_type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const keywordCounts = await emailCollection
      .aggregate([
        { $group: { _id: "$Keyword Category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    res.json({
      totalEmails,
      domainTypes: domainTypeCounts,
      keywordCategories: keywordCounts,
    });
  } catch (error) {
    console.error("Error fetching cluster stats:", error);
    res.status(500).json({ error: "Unable to fetch cluster statistics." });
  }
});

router.get("/visualization-data", async (_req: Request, res: Response) => {
  try {
    // Get the most recent visualization data
    const visualizationData = await visualizationCollection.findOne(
      {},
      { sort: { createdAt: -1 } }
    );

    if (!visualizationData) {
      res.status(404).json({ error: "No visualization data found." });
      return;
    }

    console.log("📊 Found visualization data:", visualizationData._id);
    console.log("📊 Data keys:", Object.keys(visualizationData.data || {}));
    console.log(
      "📊 tsne_data present:",
      visualizationData.data && !!visualizationData.data.tsne_data
    );

    res.json(visualizationData.data);
  } catch (error) {
    console.error("Error fetching visualization data:", error);
    res.status(500).json({ error: "Unable to fetch visualization data." });
  }
});

router.get(
  "/cluster-details/:cluster_id",
  async (req: Request, res: Response) => {
    try {
      // Try finding by MongoDB ObjectId first
      let cluster;
      try {
        const objectId = new ObjectId(req.params.cluster_id);
        cluster = await clusterCollection.findOne({ _id: objectId });
      } catch (e) {
        // If not a valid ObjectId, try finding by numeric cluster_id
        const clusterId = parseInt(req.params.cluster_id);
        if (!isNaN(clusterId)) {
          cluster = await clusterCollection.findOne({ cluster_id: clusterId });
        }
      }

      if (!cluster) {
        res.status(404).json({ error: "Cluster not found." });
        return;
      }

      res.json(cluster);
    } catch (error) {
      console.error("Error fetching cluster details:", error);
      res.status(500).json({ error: "Unable to fetch cluster details." });
    }
  }
);

// Get emails by university
router.get(
  "/emails-by-university/:university",
  async (req: Request, res: Response) => {
    try {
      const university = req.params.university;

      const emails = await emailCollection
        .find(
          { university_name: university },
          { projection: { Email: 1, domain_type: 1, domain: 1, _id: 0 } }
        )
        .toArray();

      res.json(emails);
    } catch (error) {
      console.error("Error fetching university emails:", error);
      res.status(500).json({ error: "Unable to fetch university emails." });
    }
  }
);

// Get all clusters for admin management
router.get("/clusters", async (_req: Request, res: Response) => {
  try {
    const clusters = await clusterCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.json(clusters);
  } catch (error) {
    console.error("Error fetching all clusters:", error);
    res.status(500).json({ error: "Unable to fetch clusters." });
  }
});

// Update a cluster (for admin)
router.put("/clusters/:id", async (req: Request, res: Response) => {
  try {
    const { name, description, engagement_potential } = req.body;
    const clusterId = req.params.id;

    const objectId = new ObjectId(clusterId);

    // Update only the fields that are allowed to be changed
    await clusterCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          name,
          description,
          engagement_potential,
          updatedAt: new Date(),
        },
      }
    );

    res.json({ message: "Cluster updated successfully" });
  } catch (error) {
    console.error("Error updating cluster:", error);
    res.status(500).json({ error: "Unable to update cluster." });
  }
});

// Update cluster status (archive/activate)
router.patch(
  "/clusters/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.body;
      const clusterId = req.params.id;

      // Validate status
      if (!["active", "archived", "draft"].includes(status)) {
        res.status(400).json({ error: "Invalid status value." });
        return;
      }

      const objectId = new ObjectId(clusterId);

      await clusterCollection.updateOne(
        { _id: objectId },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        }
      );

      res.json({ message: "Cluster status updated successfully" });
    } catch (error) {
      console.error("Error updating cluster status:", error);
      res.status(500).json({ error: "Unable to update cluster status." });
    }
  }
);

router.get("/performance-metrics", async (req: Request, res: Response) => {
  await getPerformanceMetrics(req, res);
});
router.get("/model/compare-algorithms", async (req: Request, res: Response) => {
  await compareAlgorithms(req, res);
});
router.get("/model/pipeline-metrics", async (req: Request, res: Response) => {
  await getPipelineMetrics(req, res);
});
router.post("/model/pipeline-metrics", async (req: Request, res: Response) => {
  await storePipelineMetrics(req, res);
});



export default router;
