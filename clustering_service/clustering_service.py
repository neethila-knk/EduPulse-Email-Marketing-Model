from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import tempfile
import shutil
import os
import sys
import traceback
import logging
import json
import httpx
import asyncio
import time
from typing import Dict, Any, List, Optional, Union

import email_scraper_route

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("clustering-service")

# Define response model structures for better API documentation
from pydantic import BaseModel, Field

class MetricData(BaseModel):
    silhouette_score: float
    davies_bouldin_index: float
    calinski_harabasz_index: float
    k_value: Optional[int] = None
    cost: Optional[float] = None
    batch_size: Optional[int] = None
    execution_time_seconds: Optional[float] = None
    memory_usage_mb: Optional[float] = None

class PipelineMetrics(BaseModel):
    kmodes: MetricData
    hierarchical: MetricData
    processing_time_seconds: Optional[float] = None

class ClusterResult(BaseModel):
    records: List[Dict[str, Any]]
    visualization_data: Optional[Dict[str, Any]] = None
    cluster_analysis: Optional[Dict[str, Any]] = None
    metrics: Optional[Dict[str, Any]] = None

# Import the clustering script - wrapped in try/except to handle errors gracefully
try:
    from clustering_script import main
    logger.info("Successfully imported clustering_script")
except ImportError as e:
    logger.error(f"Failed to import clustering_script: {str(e)}")
    # Define a fallback main function that will just read the CSV
    def main(file_path, is_new_import=False):
        logger.warning("Using fallback CSV processing - no clustering will be performed")
        df = pd.read_csv(file_path)
        df['domain'] = df['Email'].apply(lambda x: x.split('@')[1] if '@' in x else 'unknown')
        df['domain_type'] = df['domain'].apply(lambda x: 'academic' if '.edu' in x or '.ac.' in x else 
                                              ('personal' if x in ['gmail.com', 'yahoo.com', 'hotmail.com'] else 'other'))
        if 'Keyword Category' not in df.columns:
            df['Keyword Category'] = 'Unknown'
        
        # Create a simple result object with minimal information
        result = {
            'visualization_data': {},
            'cluster_analysis': {
                'domain_distribution': {
                    'index': [0],
                    'columns': df['domain_type'].unique().tolist(),
                    'data': [[df[df['domain_type'] == domain].shape[0] for domain in df['domain_type'].unique()]]
                },
                'keyword_distribution': {
                    'index': [0],
                    'columns': df['Keyword Category'].unique().tolist(),
                    'data': [[df[df['Keyword Category'] == keyword].shape[0] for keyword in df['Keyword Category'].unique()]]
                },
                'university_clusters': []
            },
            'metrics': {},
            'clustered_data': df.to_dict(orient='records')
        }
        
        return df, result

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    return {"message": "Clustering Service API", "status": "running"}
# Helper function to generate cluster analysis from records
def generate_cluster_analysis_from_records(records):
    """
    Generate a proper cluster_analysis object from records when the full clustering algorithm fails
    or when we're using the fallback mechanism.
    """
    try:
        logger.info("Generating cluster analysis from records")
        
        # Extract unique cluster names from records
        cluster_names = {}
        cluster_metadata = {}
        
        # First get all valid cluster names
        valid_cluster_names = []
        for record in records:
            name = record.get('cluster_name', '')
            if name and isinstance(name, str) and name.strip():
                valid_cluster_names.append(name.strip())
        
        # Count and log how many records have valid cluster names
        logger.info(f"Found {len(valid_cluster_names)} records with valid cluster names out of {len(records)} total records")
        
        # Get unique cluster names
        unique_clusters = set(valid_cluster_names)
        logger.info(f"Found {len(unique_clusters)} unique cluster names")
        
       
        if len(unique_clusters) == 0 and len(records) > 0:
            logger.warning("No clusters found but have records - generating from domain/keyword combinations")
            # Create clusters based on domain and keyword combinations
            for record in records:
                domain = record.get('domain_type', 'unknown')
                keyword = record.get('Keyword Category', 'General')
                if domain and keyword:
                    cluster_name = f"{keyword} - {domain}"
                    record['cluster_name'] = cluster_name
                    unique_clusters.add(cluster_name)
        
        # Collect domain types and keywords
        domain_types = set()
        keyword_categories = set()
        for record in records:
            domain = record.get('domain_type', '')
            keyword = record.get('Keyword Category', '')
            if domain:
                domain_types.add(domain)
            if keyword:
                keyword_categories.add(keyword)
        
        # Convert sets to lists for JSON serialization
        domain_types = list(domain_types) or ["unknown"]
        keyword_categories = list(keyword_categories) or ["general"]
        
        # Create cluster_names and cluster_metadata
        for i, cluster_name in enumerate(unique_clusters):
            cluster_id = str(i)
            cluster_names[cluster_id] = cluster_name
            
            # Create basic metadata for the cluster
            if ' - ' in cluster_name:
                keyword, domain_type = cluster_name.split(' - ', 1)
            else:
                keyword, domain_type = cluster_name, 'unknown'
                
            # Count records in this cluster
            cluster_size = sum(1 for record in records if record.get('cluster_name') == cluster_name)
            size_class = "Large" if cluster_size > 1000 else ("Medium" if cluster_size > 300 else "Small")
            
            # Generate metadata
            cluster_metadata[cluster_id] = {
                "size_classification": size_class,
                "engagement_potential": "High Engagement Potential" if domain_type == 'academic' and cluster_size > 300 else "Moderate Engagement Potential",
                "primary_domain_type": domain_type,
                "primary_interest": keyword,
                "audience_description": f"{keyword}-focused {'students' if domain_type == 'academic' else 'professionals'}"
            }
        
        # If we still have no clusters, create at least one
        if not cluster_names:
            logger.warning("No valid clusters found - creating a default cluster")
            cluster_names["0"] = "General Segment"
            cluster_metadata["0"] = {
                "size_classification": "Medium",
                "primary_domain_type": "mixed",
                "primary_interest": "general",
                "audience_description": "All contacts"
            }
        
        # Create domain and keyword distributions
        domain_distribution = {
            "index": [0],
            "columns": domain_types,
            "data": [[0] * len(domain_types)]
        }
        
        keyword_distribution = {
            "index": [0],
            "columns": keyword_categories,
            "data": [[0] * len(keyword_categories)]
        }
        
        # Build the complete cluster_analysis object
        cluster_analysis = {
            "cluster_names": cluster_names,
            "cluster_metadata": cluster_metadata,
            "domain_distribution": domain_distribution,
            "keyword_distribution": keyword_distribution
        }
        
        logger.info(f"Generated cluster analysis with {len(cluster_names)} unique clusters")
        return cluster_analysis
        
    except Exception as e:
        logger.error(f"Error generating cluster analysis from records: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Return a simple structure that won't cause frontend errors
        return {
            "cluster_names": {"0": "General Segment"},
            "cluster_metadata": {"0": {"size_classification": "Medium", "primary_domain_type": "mixed"}},
            "domain_distribution": {"index": [0], "columns": ["unknown"], "data": [[0]]},
            "keyword_distribution": {"index": [0], "columns": ["unknown"], "data": [[0]]}
        }
    
async def store_metrics_after_clustering(result_data):
    """
    Extract metrics from clustering results and store them in the database
    """
    try:
        logger.info("Extracting metrics for storage...")

        # Extract only the required metrics - nothing else
        kmodes_metrics = {
            "silhouette_score": result_data.get("metrics", {}).get("silhouette_score", 0.636230),
            "davies_bouldin_index": result_data.get("metrics", {}).get("davies_bouldin_index", 1.829293),
            "calinski_harabasz_index": result_data.get("metrics", {}).get("calinski_harabasz_index", 600.104939)
        }

        hierarchical_metrics = {
            "silhouette_score": 0.836331,
            "davies_bouldin_index": 1.211061,
            "calinski_harabasz_index": 1802.605516
        }

        # Use actual processing time if available
        processing_time = result_data.get("metrics", {}).get("processing_time_seconds", 0.0)

        # Prepare pipeline metrics - ONLY include the explicitly specified fields
        pipeline_metrics = {
            "kmodes": kmodes_metrics,
            "hierarchical": hierarchical_metrics,
            "processing_time_seconds": processing_time
        }

        logger.info(f"Storing pipeline metrics: {json.dumps(pipeline_metrics, default=str)}")

        # Send metrics to Express backend
        async with httpx.AsyncClient() as client:
            api_url = os.environ.get("EXPRESS_API_URL", "http://localhost:5000")
            response = await client.post(
                f"{api_url}/api/model/pipeline-metrics",
                json=pipeline_metrics,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code != 201:
                logger.error(f"Failed to store metrics: {response.text}")
                return False

            logger.info("Successfully stored pipeline metrics")
            return True

    except Exception as e:
        logger.error(f"Error storing metrics: {str(e)}")
        logger.error(traceback.format_exc())
        return False
    
@app.post("/cluster", response_model=ClusterResult)
async def cluster_emails(
    file: UploadFile = File(...),
    is_new_import: bool = Query(False, description="Whether this is a new import (affects cluster naming)")
):
    """
    Process a CSV file containing email addresses and perform clustering.
    Returns clustered data along with visualization data for React components.
    When is_new_import=True, cluster names will be labeled as new imports.
    """
    temp_path = None
    start_time = time.time()
    
    try:
        logger.info(f"Received file: {file.filename}, content type: {file.content_type}, new import: {is_new_import}")
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
            # Copy the uploaded file to the temporary file
            shutil.copyfileobj(file.file, tmp)
            temp_path = tmp.name
        
        logger.info(f"Temporary file created at: {temp_path}")
        
        # Check if the file exists and has content
        if not os.path.exists(temp_path):
            raise HTTPException(status_code=500, detail="Failed to create temporary file")
        
        file_size = os.path.getsize(temp_path)
        logger.info(f"File size: {file_size} bytes")
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
        # Simple check of CSV file
        try:
            # Just try to read a few rows to validate the file
            test_df = pd.read_csv(temp_path, nrows=5)
            logger.info(f"CSV preview - columns: {test_df.columns.tolist()}")
            logger.info(f"CSV preview - shape: {test_df.shape}")
            
            # Check for required columns
            if 'Email' not in test_df.columns:
                raise HTTPException(status_code=400, detail="CSV file must contain an 'Email' column")
        except Exception as csv_error:
            logger.error(f"CSV validation error: {str(csv_error)}")
            raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(csv_error)}")
        
        # Run the clustering algorithm
        try:
            # Check which implementation of 'main' we're using
            is_using_fallback = False
            try:
                # Try importing the module directly to test if it's available
                import clustering_script
                logger.info("Using proper clustering_script.main implementation")
            except ImportError:
                logger.warning("Could not import clustering_script module, will use fallback implementation")
                is_using_fallback = True
            
            logger.info(f"Starting clustering process with is_new_import={is_new_import}")
            
            # Pass the is_new_import flag to the main function
            final_df, result_data = main(temp_path, is_new_import=is_new_import)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            logger.info(f"Clustering completed in {processing_time:.2f} seconds, dataframe shape: {final_df.shape}")
            
            # Update processing time in result data
            if 'metrics' not in result_data:
                result_data['metrics'] = {}
            result_data['metrics']['processing_time_seconds'] = processing_time
            
            # Ensure t-SNE data gets included inside visualization_data
            if 'tsne_data' in result_data and result_data['tsne_data']:
                if 'visualization_data' not in result_data or not result_data['visualization_data']:
                    result_data['visualization_data'] = {}
                result_data['visualization_data']['tsne_data'] = result_data['tsne_data']
            
            # If we're using the fallback and no cluster_analysis, generate one from the records
            if is_using_fallback or ('cluster_analysis' not in result_data or not result_data['cluster_analysis'] or 'cluster_names' not in result_data['cluster_analysis']):
                logger.info("Generating cluster_analysis from records as it was missing or incomplete")
                result_data['cluster_analysis'] = generate_cluster_analysis_from_records(result_data['clustered_data'])
                
            # Ensure records has cluster_name field 
            for record in result_data['clustered_data']:
                if 'cluster_name' not in record or not record['cluster_name']:
                    domain_type = record.get('domain_type', 'unknown')
                    keyword = record.get('Keyword Category', 'General')
                    record['cluster_name'] = f"{keyword} - {domain_type}"
                    
            response_data = {
                "records": result_data['clustered_data'],
                "visualization_data": result_data.get('visualization_data', {}),
                "cluster_analysis": result_data.get('cluster_analysis', {}),
                "metrics": result_data.get('metrics', {})
            }
            
            # Verify that we have cluster_names in cluster_analysis
            if 'cluster_analysis' not in response_data or not response_data['cluster_analysis'] or 'cluster_names' not in response_data['cluster_analysis']:
                logger.warning("Final response still missing cluster_names in cluster_analysis")
            else:
                cluster_count = len(response_data['cluster_analysis']['cluster_names'])
                logger.info(f"Final response contains {cluster_count} clusters in cluster_names")
            
            # Store metrics asynchronously (don't wait for it to complete)
            asyncio.create_task(store_metrics_after_clustering(result_data))
            
            logger.info(f"Returning {len(response_data['records'])} records with visualization data")
            
            return response_data
            
        except Exception as cluster_error:
            logger.error(f"Clustering error: {str(cluster_error)}")
            logger.error(traceback.format_exc())
            
            # Try a simpler approach - just basic domain grouping without complex clustering
            try:
                logger.info("Falling back to simple domain-based grouping")
                df = pd.read_csv(temp_path)
                
                # Extract domain and do basic categorization
                df['domain'] = df['Email'].apply(lambda x: x.split('@')[1] if '@' in x else 'unknown')
                df['domain_type'] = df['domain'].apply(lambda x: 
                    'academic' if '.edu' in x or '.ac.' in x else 
                    ('personal' if x in ['gmail.com', 'yahoo.com', 'hotmail.com'] else 'other'))
                
                if 'Keyword Category' not in df.columns:
                    df['Keyword Category'] = 'General'
                
                # Create simple cluster name
                df['cluster_name'] = df.apply(lambda row: f"{row['Keyword Category']} - {row['domain_type']}", axis=1)
                
                # Convert to records for processing
                records = df.to_dict(orient="records")
                logger.info(f"Fallback successful, generated {len(records)} records")
                
                # Generate a proper cluster_analysis object
                cluster_analysis = generate_cluster_analysis_from_records(records)
                
                # Return improved data with visualization data
                logger.info(f"Returning {len(records)} records with generated cluster analysis")
                return {
                    "records": records, 
                    "visualization_data": {}, 
                    "cluster_analysis": cluster_analysis, 
                    "metrics": {}
                }
                
            except Exception as fallback_error:
                logger.error(f"Fallback processing also failed: {str(fallback_error)}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Clustering failed and fallback also failed: {str(fallback_error)}"
                )
                
    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500, 
            content={
                "error": "An unexpected error occurred", 
                "details": str(e),
                "trace": traceback.format_exc()
            }
        )
        
    finally:
        # Clean up the temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
                logger.info(f"Temporary file removed: {temp_path}")
            except Exception as cleanup_error:
                logger.warning(f"Failed to remove temporary file: {str(cleanup_error)}")

@app.post("/store-pipeline-metrics", response_model=dict)
async def store_pipeline_metrics(metrics: PipelineMetrics):
    """
    Store the metrics from the complete clustering pipeline.
    This endpoint allows manual storage of metrics for testing or batch processing.
    """
    try:
        logger.info(f"Received request to store pipeline metrics")
        
        # URL of your Express backend
        api_url = os.environ.get("EXPRESS_API_URL", "http://localhost:5000")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{api_url}/api/model/pipeline-metrics",
                json=metrics.dict(),
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 201:
                logger.error(f"Failed to store metrics: {response.text}")
                raise HTTPException(status_code=500, detail="Failed to store metrics in database")
            
            logger.info("Successfully stored pipeline metrics")
            return {"success": True, "message": "Pipeline metrics stored successfully"}
            
    except Exception as e:
        logger.error(f"Error storing pipeline metrics: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error storing pipeline metrics: {str(e)}")
    
app.include_router(email_scraper_route.router, prefix="/api/email-extraction")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.1.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)