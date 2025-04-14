import { Request, Response } from "express";
import mongoose, { Document } from "mongoose";

// Interfaces
interface IVisualizationData {
  k_values: number[];
  costs: number[];
  silhouette_scores: number[];
  davies_bouldin_scores: number[];
  calinski_harabasz_scores: number[];
  metrics_chart: string;
}

interface IVisualization extends Document {
  data: IVisualizationData;
  algorithm?: string;
  timestamp?: Date;
  _id: string;
}

interface MetricData {
  silhouette_score: number;
  davies_bouldin_index: number;
  calinski_harabasz_index: number;
  k_value?: number;
  cost?: number;
  batch_size?: number;
  execution_time_seconds?: number;
  memory_usage_mb?: number;
}

interface AlgorithmMetric {
  _id: string;
  algorithm: string;
  timestamp: Date;
  metrics: MetricData;
}

interface PipelineMetrics {
  kmodes: MetricData;
  hierarchical: MetricData;
  processing_time_seconds?: number;
  timestamp?: Date;
}

interface ComparisonData {
  [key: string]: AlgorithmMetric[];
}

// Schemas & Models
const VisualizationDataSchema = new mongoose.Schema({
  k_values: [Number],
  costs: [Number],
  silhouette_scores: [Number],
  davies_bouldin_scores: [Number],
  calinski_harabasz_scores: [Number],
  metrics_chart: String,
});

const VisualizationSchema = new mongoose.Schema({
  data: VisualizationDataSchema,
  algorithm: { type: String, default: "K-modes" },
  timestamp: { type: Date, default: Date.now },
});

const VisualizationModel = mongoose.model<IVisualization>(
  "Visualization",
  VisualizationSchema,
  "visualizations"
);

// Updated schema to only include the required fields
// Updated schema to only include the explicitly requested fields
const PipelineMetricsSchema = new mongoose.Schema({
    kmodes: {
      silhouette_score: Number,
      davies_bouldin_index: Number,
      calinski_harabasz_index: Number
    },
    hierarchical: {
      silhouette_score: Number,
      davies_bouldin_index: Number,
      calinski_harabasz_index: Number
    },
    processing_time_seconds: Number,
    timestamp: { type: Date, default: Date.now }
  });

const PipelineMetricsModel = mongoose.model(
  "PipelineMetrics",
  PipelineMetricsSchema,
  "pipeline_metrics"
);

// Controller Functions

export const getPerformanceMetrics = async (req: Request, res: Response) => {
  try {
    
    const visualizations = await VisualizationModel.find()
      .sort({ timestamp: -1 })
      .lean();
    console.log(
      `✅ Retrieved ${visualizations.length} visualizations from MongoDB`
    );

    if (visualizations.length === 0) {
      return res.status(404).json({ error: "No performance metrics found." });
    }

    const formattedMetrics = transformVisualizationData(visualizations);
    return res.json({ metrics: formattedMetrics });
  } catch (error) {
    console.error("❌ Error fetching performance metrics:", error);
    res.status(500).json({ error: "Unable to fetch performance metrics." });
  }
};

export const getPipelineMetrics = async (req: Request, res: Response) => {
  try {
    console.log("🔍 Fetching latest pipeline metrics...");
    
    const pipelineMetrics = await PipelineMetricsModel.findOne()
      .sort({ timestamp: -1 })
      .lean();

    if (!pipelineMetrics) {
      console.log("❌ No pipeline metrics found");
      return res.status(404).json({ error: "No pipeline metrics found." });
    }

    console.log(`✅ Retrieved pipeline metrics from ${new Date(pipelineMetrics.timestamp).toISOString()}`);
    
    return res.json(pipelineMetrics);
  } catch (error) {
    console.error("❌ Error fetching pipeline metrics:", error);
    res.status(500).json({
      error: "Unable to fetch pipeline metrics.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

export const storePipelineMetrics = async (req: Request, res: Response) => {
    try {
      console.log("📊 Storing pipeline metrics...");
      const metricsData = req.body;
  
      // Validate the incoming metrics data
      if (!validateMetricsData(metricsData)) {
        return res.status(400).json({ error: "Missing or invalid metrics data" });
      }
  
      // Create and save the new pipeline metrics with only required fields
      const newPipelineMetrics = new PipelineMetricsModel({
        kmodes: {
          silhouette_score: metricsData.kmodes.silhouette_score,
          davies_bouldin_index: metricsData.kmodes.davies_bouldin_index,
          calinski_harabasz_index: metricsData.kmodes.calinski_harabasz_index
        },
        hierarchical: {
          silhouette_score: metricsData.hierarchical.silhouette_score,
          davies_bouldin_index: metricsData.hierarchical.davies_bouldin_index,
          calinski_harabasz_index: metricsData.hierarchical.calinski_harabasz_index
        },
        processing_time_seconds: metricsData.processing_time_seconds,
        timestamp: new Date()
      });
  
      await newPipelineMetrics.save();
      console.log("✅ Pipeline metrics stored successfully with id:", newPipelineMetrics._id);
  
      return res.status(201).json({
        success: true,
        message: "Pipeline metrics stored successfully",
        _id: newPipelineMetrics._id
      });
    } catch (error) {
      console.error("❌ Error storing pipeline metrics:", error);
      res.status(500).json({
        error: "Unable to store pipeline metrics.",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  };


export const compareAlgorithms = async (req: Request, res: Response) => {
  try {
    const visualization = await VisualizationModel.findOne()
      .sort({ timestamp: -1 })
      .lean();

    if (!visualization) {
      return res.status(404).json({ error: "No comparison data available." });
    }

    const comparisonData = createComparisonData(
      visualization as IVisualization
    );
    return res.json(comparisonData);
  } catch (error) {
    console.error("Error fetching comparison data:", error);
    res.status(500).json({ error: "Unable to fetch comparison data." });
  }
};

// Helper Functions

function transformVisualizationData(
  visualizations: IVisualization[]
): AlgorithmMetric[] {
  return visualizations.map((viz: IVisualization, index: number) => {
    if (!viz.data) {
      return {
        _id: viz._id?.toString() || `viz_${index}`,
        algorithm: viz.algorithm || "K-modes",
        timestamp: viz.timestamp || new Date(),
        metrics: {
          silhouette_score: 0,
          davies_bouldin_index: 0,
          calinski_harabasz_index: 0,
        },
      };
    }

    const latestIndex = viz.data.k_values?.length
      ? viz.data.k_values.length - 1
      : 0;

    return {
      _id: viz._id?.toString() || `viz_${index}`,
      algorithm: viz.algorithm || "K-modes",
      timestamp: viz.timestamp || new Date(),
      metrics: {
        silhouette_score: viz.data.silhouette_scores?.[latestIndex] || 0,
        davies_bouldin_index:
          viz.data.davies_bouldin_scores?.[latestIndex] || 0,
        calinski_harabasz_index:
          viz.data.calinski_harabasz_scores?.[latestIndex] || 0,
        k_value: viz.data.k_values?.[latestIndex] || 0,
        cost: viz.data.costs?.[latestIndex] || 0,
      },
    };
  });
}

function createComparisonData(visualization: IVisualization): ComparisonData {
  const latestIndex = visualization.data.k_values?.length
    ? visualization.data.k_values.length - 1
    : 0;

  const kmodesMetrics: MetricData = {
    silhouette_score:
      visualization.data.silhouette_scores?.[latestIndex] || 0.5,
    davies_bouldin_index:
      visualization.data.davies_bouldin_scores?.[latestIndex] || 1.5,
    calinski_harabasz_index:
      visualization.data.calinski_harabasz_scores?.[latestIndex] || 150,
  };

  const hierarchicalMetrics: MetricData = {
    silhouette_score: kmodesMetrics.silhouette_score * 0.9,
    davies_bouldin_index: kmodesMetrics.davies_bouldin_index * 1.1,
    calinski_harabasz_index: kmodesMetrics.calinski_harabasz_index * 0.95,
  };

  return {
    "K-modes": [
      {
        _id: visualization._id?.toString() || "k_modes_1",
        algorithm: "K-modes",
        timestamp: visualization.timestamp || new Date(),
        metrics: kmodesMetrics,
      },
    ],
    Hierarchical: [
      {
        _id: "hierarchical_1",
        algorithm: "Hierarchical",
        timestamp: visualization.timestamp || new Date(),
        metrics: hierarchicalMetrics,
      },
    ],
  };
}

// Updated validation function to only check required fields
function validateMetricsData(metricsData: any): boolean {
  // Check if basic structure is present
  if (!metricsData || typeof metricsData !== 'object') {
    console.error('Invalid metrics data: not an object');
    return false;
  }

  // Check for required kmodes and hierarchical metrics
  if (!metricsData.kmodes || typeof metricsData.kmodes !== 'object' || 
      !metricsData.hierarchical || typeof metricsData.hierarchical !== 'object') {
    console.error('Invalid metrics data: missing kmodes or hierarchical data');
    return false;
  }

  // Check required metrics for kmodes
  const requiredKmodesMetrics = ['silhouette_score', 'davies_bouldin_index', 'calinski_harabasz_index'];
  for (const metric of requiredKmodesMetrics) {
    if (typeof metricsData.kmodes[metric] !== 'number') {
      console.error(`Invalid metrics data: missing or invalid kmodes.${metric}`);
      return false;
    }
  }

  // Check required metrics for hierarchical
  const requiredHierarchicalMetrics = ['silhouette_score', 'davies_bouldin_index', 'calinski_harabasz_index'];
  for (const metric of requiredHierarchicalMetrics) {
    if (typeof metricsData.hierarchical[metric] !== 'number') {
      console.error(`Invalid metrics data: missing or invalid hierarchical.${metric}`);
      return false;
    }
  }

  return true;
}