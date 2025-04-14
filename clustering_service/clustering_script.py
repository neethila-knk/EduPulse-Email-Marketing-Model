import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from kmodes.kmodes import KModes
from scipy.cluster.hierarchy import linkage, fcluster, dendrogram
import matplotlib.pyplot as plt
import seaborn as sns
from gower import gower_matrix
from sklearn.manifold import TSNE
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
import warnings
from collections import Counter
import json
import base64
from io import BytesIO
import matplotlib
matplotlib.use('Agg')  # Use the Agg backend to prevent display issues

warnings.filterwarnings('ignore')

# Global constants
SRI_LANKAN_EDU_DOMAINS = ['sliit.lk', 'kdu.ac.lk', 'iit.ac.lk', 'sltc.ac.lk', 'nsbm.ac.lk', 'uom.lk',
                          'cmb.ac.lk', 'pdn.ac.lk', 'ruh.ac.lk', 'sjp.ac.lk', 'ou.ac.lk', 'cinec.edu']

UNIVERSITY_MAP = {
    "kdu": "Kotelawala Defence University", "sliit": "Sri Lanka Institute of Information Technology",
    "iit": "Informatics Institute of Technology", "nsbm": "National School of Business Management",
    "uom": "University of Moratuwa", "kln": "University of Kelaniya",
    "sjp": "University of Sri Jayewardenepura", "seu": "South Eastern University",
    "wyb": "Wayamba University", "ou": "Open University", "ruh": "University of Ruhuna",
    "jfn": "University of Jaffna", "cmb": "University of Colombo", "pdn": "University of Peradeniya",
    "uwu": "Uva Wellassa University", "esn": "Eastern University", "vpa": "Visual and Performing Arts University",
    "wusl": "Wayamba University", "sab": "Sabaragamuwa University", "cinec": "CINEC Maritime Campus",
    "sltc": "Sri Lanka Technological Campus"
}

PERSONAL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
                    'icloud.com', 'live.com', 'ymail.com', 'googlemail.com']


# Helper function to convert matplotlib figures to base64 data
def fig_to_base64(fig):
    buffer = BytesIO()
    fig.savefig(buffer, format='png', bbox_inches='tight')
    buffer.seek(0)
    image_png = buffer.getvalue()
    buffer.close()
    encoded = base64.b64encode(image_png).decode('utf-8')
    return encoded


# Helper functions
def extract_domain(email):
    try:
        return email.split('@')[1].lower()
    except:
        return None


def identify_university(domain):
    if not domain:
        return None

    # Check for direct matches
    for abbr, univ_name in UNIVERSITY_MAP.items():
        if domain == f"{abbr}.ac.lk" or domain == f"{abbr}.edu.lk" or domain == f"{abbr}.lk":
            return univ_name

    # Check for partial matches
    for abbr, univ_name in UNIVERSITY_MAP.items():
        parts = domain.split('.')
        if abbr in parts or any(part.startswith(abbr) or part.endswith(abbr) for part in parts):
            return univ_name

    # Check if domain contains university name text
    lower_domain = domain.lower()
    for univ_name in UNIVERSITY_MAP.values():
        simplified_name = univ_name.lower().replace("university", "").replace("institute", "").strip()
        words = simplified_name.split()
        if any(word in lower_domain for word in words if len(word) > 3):
            return univ_name

    return None


def get_domain_type(domain):
    if not domain:
        return 'unknown'

    # Academic domains
    if (domain in SRI_LANKAN_EDU_DOMAINS or domain.endswith('.edu') or domain.endswith('.ac.lk') or
            domain.endswith('.edu.lk') or any(
                term in domain for term in ['university', 'college', 'institute', 'campus', 'school'])):
        return 'academic'

    # Personal email domains
    if domain in PERSONAL_DOMAINS:
        return 'personal'

    # Corporate/Business domains
    if any(domain.endswith(tld) for tld in ['.com', '.net', '.io', '.co']):
        return 'corporate'

    # Government domains
    if domain.endswith('.gov') or domain.endswith('.gov.lk'):
        return 'government'

    # Organization domains
    if domain.endswith('.org') or domain.endswith('.org.lk'):
        return 'organization'

    return 'other'


def extract_tld(domain):
    if not domain:
        return None
    parts = domain.split('.')
    return '.'.join(parts[-2:]) if parts[-2] == 'ac' else parts[-1]


def is_sri_lankan(domain):
    return 1 if domain and ('.lk' in domain) else 0


# Data processing functions
def add_academic_features(df):
    # Add binary feature for Sri Lankan academic institutions
    df['is_sl_academic'] = df['domain'].apply(
        lambda domain: 1 if (domain in SRI_LANKAN_EDU_DOMAINS or
                             domain.endswith('.ac.lk') or domain.endswith('.edu.lk')) else 0)

    # Add feature for academic level
    df['academic_level'] = df['domain'].apply(
        lambda domain: 2 if (domain in SRI_LANKAN_EDU_DOMAINS or domain.endswith('.ac.lk')) else
        (1 if (domain.endswith('.edu') or 'university' in domain or 'college' in domain) else 0))

    # Add university identification
    df['university_name'] = df['domain'].apply(identify_university)
    df['is_identified_university'] = df['university_name'].apply(lambda x: 0 if x is None else 1)

    return df


def load_and_preprocess_data(file_path):
    # Read and process data
    df = pd.read_csv(file_path)
    print(f"Original data shape: {df.shape}")

    # Extract domain information
    df['domain'] = df['Email'].apply(extract_domain)
    df['domain_type'] = df['domain'].apply(get_domain_type)
    df['tld'] = df['domain'].apply(extract_tld)
    df['is_sri_lankan'] = df['domain'].apply(is_sri_lankan)

    # Remove entries with missing domains
    df = df.dropna(subset=['domain'])

    # Data summary
    print(f"\nData Summary:\nEmails: {len(df)}, Unique domains: {df['domain'].nunique()}")
    print(f"Domain types: {df['domain_type'].nunique()}, Keyword categories: {df['Keyword Category'].nunique()}")
    print("\nDomain type distribution:")
    print(df['domain_type'].value_counts())
    print("\nKeyword category distribution:")
    print(df['Keyword Category'].value_counts())
    print("\nTop 10 domains:")
    print(df['domain'].value_counts().head(10))

    return df


def prepare_for_clustering(df):
    # Encode categorical variables
    encoders = {}
    for field in ['domain_type', 'Keyword Category', 'tld']:
        encoder = LabelEncoder()
        df[f'{field.split()[0].lower()}_encoded'] = encoder.fit_transform(df[field])
        encoders[field.split()[0].lower()] = encoder

    # Add academic features
    df = add_academic_features(df)

    # Encode university names
    df['university_name_filled'] = df['university_name'].fillna('Unknown')
    university_encoder = LabelEncoder()
    df['university_encoded'] = university_encoder.fit_transform(df['university_name_filled'])
    encoders['university'] = university_encoder

    # Feature matrix
    X_kmodes = df[['domain_type_encoded', 'keyword_encoded', 'tld_encoded',
                   'is_sri_lankan', 'is_sl_academic', 'academic_level',
                   'is_identified_university', 'university_encoded']].values

    return df, X_kmodes, encoders


def compute_tsne_coordinates(X, n_components=2, perplexity=30, learning_rate=200):
    print("\nComputing t-SNE coordinates for 2D visualization...")
    tsne = TSNE(n_components=n_components, perplexity=perplexity, learning_rate=learning_rate, random_state=42)
    return tsne.fit_transform(X)


# Evaluation functions
def evaluate_clustering(X, clusters, distance_matrix=None):
    metrics = {}

    # Convert categorical data to one-hot encoding if needed
    X_numeric = pd.get_dummies(X).values if isinstance(X, pd.DataFrame) else X.copy()

    # Calculate metrics
    try:
        if distance_matrix is not None:
            metrics['silhouette'] = silhouette_score(distance_matrix, clusters, metric='precomputed')
        else:
            metrics['silhouette'] = silhouette_score(X_numeric, clusters)
    except:
        metrics['silhouette'] = "Could not compute"

    try:
        metrics['davies_bouldin'] = davies_bouldin_score(X_numeric, clusters)
    except:
        metrics['davies_bouldin'] = "Could not compute"

    try:
        metrics['calinski_harabasz'] = calinski_harabasz_score(X_numeric, clusters)
    except:
        metrics['calinski_harabasz'] = "Could not compute"

    return metrics


# Clustering functions

def find_optimal_k_with_metrics(X, max_k=15):
    print("\nFinding optimal number of clusters for K-modes...")

    # Parallelize the loop with joblib
    from joblib import Parallel, delayed

    costs, silhouettes, davies_bouldin_scores, calinski_harabasz_scores = [], [], [], []

    def evaluate_k(k, X):
        kmode = KModes(n_clusters=k, init='Huang', random_state=42, n_init=5)
        clusters = kmode.fit_predict(X)
        cost = kmode.cost_
        metrics = evaluate_clustering(X, clusters)
        silhouette_val = float(metrics['silhouette']) if not isinstance(metrics['silhouette'], str) else np.nan
        davies_val = float(metrics['davies_bouldin']) if not isinstance(metrics['davies_bouldin'], str) else np.nan
        calinski_val = float(metrics['calinski_harabasz']) if not isinstance(metrics['calinski_harabasz'], str) else np.nan
        return k, cost, silhouette_val, davies_val, calinski_val

    results = Parallel(n_jobs=-1)(delayed(evaluate_k)(k, X) for k in range(2, max_k + 1))
    results.sort(key=lambda x: x[0])
    for res in results:
        k, cost, silhouette_val, davies_val, calinski_val = res
        costs.append(cost)
        silhouettes.append(silhouette_val)
        davies_bouldin_scores.append(davies_val)
        calinski_harabasz_scores.append(calinski_val)
        print(f"K = {k}, Cost = {cost}, Silhouette = {silhouette_val}, " +
              f"Davies-Bouldin = {davies_val}, Calinski-Harabasz = {calinski_val}")

    # Create visualization data for charts instead of saving PNGs
    k_values = list(range(2, max_k + 1))
    
    visualization_data = {
        'k_values': k_values,
        'costs': costs,
        'silhouette_scores': silhouettes,
        'davies_bouldin_scores': davies_bouldin_scores,
        'calinski_harabasz_scores': calinski_harabasz_scores
    }

    # Also create the figure as base64 for direct use in the frontend
    plt.figure(figsize=(15, 10))
    # Cost plot (Elbow method)
    plt.subplot(2, 2, 1)
    plt.plot(k_values, costs, 'bo-')
    plt.xlabel('Number of clusters')
    plt.ylabel('Cost')
    plt.title('Elbow Method')

    # Silhouette score plot
    plt.subplot(2, 2, 2)
    plt.plot(k_values, silhouettes, 'go-')
    plt.xlabel('Number of clusters')
    plt.ylabel('Silhouette Score')
    plt.title('Silhouette Score (higher is better)')

    # Davies-Bouldin index plot
    plt.subplot(2, 2, 3)
    plt.plot(k_values, davies_bouldin_scores, 'ro-')
    plt.xlabel('Number of clusters')
    plt.ylabel('Davies-Bouldin Index')
    plt.title('Davies-Bouldin Index (lower is better)')

    # Calinski-Harabasz index plot
    plt.subplot(2, 2, 4)
    plt.plot(k_values, calinski_harabasz_scores, 'mo-')
    plt.xlabel('Number of clusters')
    plt.ylabel('Calinski-Harabasz Index')
    plt.title('Calinski-Harabasz Index (higher is better)')

    plt.tight_layout()
    visualization_data['metrics_chart'] = fig_to_base64(plt)
    plt.close()

    # Find best k for each metric
    best_k_silhouette = np.nanargmax(silhouettes) + 2 if not all(np.isnan(s) for s in silhouettes) else None
    best_k_davies = np.nanargmin(davies_bouldin_scores) + 2 if not all(np.isnan(s) for s in davies_bouldin_scores) else None
    best_k_calinski = np.nanargmax(calinski_harabasz_scores) + 2 if not all(np.isnan(s) for s in calinski_harabasz_scores) else None

    # Find elbow point for cost
    diffs = np.diff(costs)
    elbow_point = np.argmin(diffs) + 2

    print(f"\nOptimal cluster numbers: Elbow: {elbow_point}, Silhouette: {best_k_silhouette}, " +
          f"Davies-Bouldin: {best_k_davies}, Calinski-Harabasz: {best_k_calinski}")

    # Get most frequent best k
    all_best_k = [k for k in [elbow_point, best_k_silhouette, best_k_davies, best_k_calinski] if k is not None]
    optimal_k = Counter(all_best_k).most_common(1)[0][0] if all_best_k else elbow_point

    print(f"\nSuggested optimal k: {optimal_k}")
    return optimal_k, visualization_data


def perform_kmodes_clustering(X, num_clusters):
    print(f"\nPerforming K-modes clustering with {num_clusters} clusters...")

    # Initialize and fit K-modes
    kmode = KModes(n_clusters=num_clusters, init='Huang', random_state=42)
    clusters = kmode.fit_predict(X)

    print(f"K-modes cost: {kmode.cost_}")

    # Evaluate clustering
    metrics = evaluate_clustering(X, clusters)
    print(f"Evaluation: Silhouette: {metrics['silhouette']}, " +
          f"Davies-Bouldin: {metrics['davies_bouldin']}, Calinski-Harabasz: {metrics['calinski_harabasz']}")

    return clusters, kmode, metrics


def find_optimal_hierarchical_clusters(df, stage1_clusters, max_clusters=15):
    print("\nFinding optimal number of clusters for hierarchical clustering...")
    visualization_data = {}

    # Prepare data
    df_h = df.copy()
    df_h['stage1_cluster'] = stage1_clusters
    cat_features = ['domain_type', 'Keyword Category', 'tld', 'stage1_cluster']

    # Compute Gower distance matrix once and get the linkage
    gower_dm = gower_matrix(df_h[cat_features])
    Z = linkage(gower_dm, method='ward')

    # Evaluate different numbers of clusters
    silhouettes, davies_bouldin_scores, calinski_harabasz_scores = [], [], []

    for k in range(2, max_clusters + 1):
        clusters = fcluster(Z, k, criterion='maxclust')
        metrics = evaluate_clustering(df_h[cat_features], clusters, distance_matrix=gower_dm)

        for metric_name, metric_list in [
            ('silhouette', silhouettes),
            ('davies_bouldin', davies_bouldin_scores),
            ('calinski_harabasz', calinski_harabasz_scores)
        ]:
            try:
                value = metrics[metric_name]
                metric_list.append(float(value) if not isinstance(value, str) else np.nan)
            except:
                metric_list.append(np.nan)

        print(f"Clusters = {k}, Silhouette = {silhouettes[-1]}, " +
              f"Davies-Bouldin = {davies_bouldin_scores[-1]}, Calinski-Harabasz = {calinski_harabasz_scores[-1]}")

    k_values = list(range(2, max_clusters + 1))
    
    visualization_data = {
        'k_values': k_values,
        'silhouette_scores': silhouettes,
        'davies_bouldin_scores': davies_bouldin_scores,
        'calinski_harabasz_scores': calinski_harabasz_scores
    }

    plt.figure(figsize=(15, 5))
    subplot_params = [
        (1, 'Silhouette Score', silhouettes, 'go-', 'higher is better'),
        (2, 'Davies-Bouldin Index', davies_bouldin_scores, 'ro-', 'lower is better'),
        (3, 'Calinski-Harabasz Index', calinski_harabasz_scores, 'mo-', 'higher is better')
    ]

    for i, (pos, title, data, style, note) in enumerate(subplot_params):
        plt.subplot(1, 3, pos)
        plt.plot(range(2, max_clusters + 1), data, style)
        plt.xlabel('Number of clusters')
        plt.ylabel(title)
        plt.title(f'{title} ({note})')

    plt.tight_layout()
    visualization_data['hierarchical_metrics_chart'] = fig_to_base64(plt)
    plt.close()

    best_k_silhouette = np.nanargmax(silhouettes) + 2 if not all(np.isnan(s) for s in silhouettes) else None
    best_k_davies = np.nanargmin(davies_bouldin_scores) + 2 if not all(np.isnan(s) for s in davies_bouldin_scores) else None
    best_k_calinski = np.nanargmax(calinski_harabasz_scores) + 2 if not all(np.isnan(s) for s in calinski_harabasz_scores) else None

    all_best_k = [k for k in [best_k_silhouette, best_k_davies, best_k_calinski] if k is not None]
    optimal_k = Counter(all_best_k).most_common(1)[0][0] if all_best_k else 5

    print(f"\nSuggested optimal hierarchical clusters: {optimal_k}")
    # Return gower_dm along with Z so that it can be reused downstream
    return optimal_k, visualization_data, Z, gower_dm


def perform_hierarchical_clustering(df, stage1_clusters, num_clusters, Z=None, gower_dm=None):
    print(f"\nPerforming hierarchical clustering with Gower distance...")
    visualization_data = {}

    df_h = df.copy()
    df_h['stage1_cluster'] = stage1_clusters
    cat_features = ['domain_type', 'Keyword Category', 'tld', 'stage1_cluster']

    # If gower_dm or Z are not provided, compute them (this branch is not reached if caching worked)
    if Z is None or gower_dm is None:
        gower_dm = gower_matrix(df_h[cat_features])
        Z = linkage(gower_dm, method='ward')
    
    clusters = fcluster(Z, num_clusters, criterion='maxclust')

    plt.figure(figsize=(12, 8))
    dendrogram(Z, truncate_mode='lastp', p=30, leaf_font_size=10)
    plt.title('Hierarchical Clustering Dendrogram')
    plt.xlabel('Samples')
    plt.ylabel('Gower Distance')
    visualization_data['dendrogram'] = fig_to_base64(plt)
    plt.close()

    # Use the cached gower_dm instead of recomputing
    metrics = evaluate_clustering(df_h[cat_features], clusters, distance_matrix=gower_dm)
    print(f"Evaluation: Silhouette: {metrics['silhouette']}, " +
          f"Davies-Bouldin: {metrics['davies_bouldin']}, Calinski-Harabasz: {metrics['calinski_harabasz']}")

    return clusters, metrics, visualization_data


# Analysis and visualization
# Modify the analyze_clusters function to use the improved naming function
def analyze_clusters(df, stage1_clusters, stage2_clusters, is_new_import=False):
    visualization_data = {}
    cluster_analysis = {}
    
    df['stage1_cluster'] = stage1_clusters
    df['stage2_cluster'] = stage2_clusters

    print("\nStage 1 Clusters (K-modes):")
    stage1_summary = df.groupby('stage1_cluster').agg({
        'domain_type': lambda x: x.value_counts().index[0],
        'Keyword Category': lambda x: x.value_counts().index[0],
        'Email': 'count'
    }).rename(columns={'Email': 'count'}).sort_values('count', ascending=False)
    
    print(stage1_summary)
    cluster_analysis['stage1_summary'] = stage1_summary.reset_index().to_dict('records')

    print("\nStage 2 Clusters (Hierarchical):")
    stage2_summary = df.groupby('stage2_cluster').agg({
        'domain_type': lambda x: x.value_counts().index[0],
        'Keyword Category': lambda x: x.value_counts().index[0],
        'Email': 'count'
    }).rename(columns={'Email': 'count'}).sort_values('count', ascending=False)
    
    print(stage2_summary)
    cluster_analysis['stage2_summary'] = stage2_summary.reset_index().to_dict('records')

    # Cross tabulations for analysis
    print("\nDomain Type Distribution in Stage 2 Clusters:")
    domain_crosstab = pd.crosstab(df['stage2_cluster'], df['domain_type'])
    print(domain_crosstab)
    cluster_analysis['domain_distribution'] = {
        'index': domain_crosstab.index.tolist(),
        'columns': domain_crosstab.columns.tolist(),
        'data': domain_crosstab.values.tolist()
    }

    print("\nKeyword Category Distribution in Stage 2 Clusters:")
    keyword_crosstab = pd.crosstab(df['stage2_cluster'], df['Keyword Category'])
    print(keyword_crosstab)
    cluster_analysis['keyword_distribution'] = {
        'index': keyword_crosstab.index.tolist(),
        'columns': keyword_crosstab.columns.tolist(),
        'data': keyword_crosstab.values.tolist()
    }

    # Generate improved cluster names
    unique_clusters = df['stage2_cluster'].unique()
    cluster_names = {}
    cluster_metadata = {}
    
    for cluster_id in unique_clusters:
        cluster_df = df[df['stage2_cluster'] == cluster_id]
        name, metadata = generate_meaningful_cluster_name(cluster_id, cluster_df, is_new_import)
        cluster_names[str(cluster_id)] = name
        cluster_metadata[str(cluster_id)] = metadata

    cluster_analysis['cluster_names'] = cluster_names
    cluster_analysis['cluster_metadata'] = cluster_metadata
    df['cluster_name'] = df['stage2_cluster'].map(cluster_names)

    # Rest of the function remains the same...
    
    return df, cluster_analysis, visualization_data

def generate_meaningful_cluster_name(cluster_id, cluster_df, is_new_import=False):
    """Generate a more descriptive and user-friendly cluster name"""
    domain_type = cluster_df['domain_type'].value_counts().index[0]
    keyword = cluster_df['Keyword Category'].value_counts().index[0]
    is_academic = domain_type == 'academic'
    university_info = ""
    
    if is_academic and cluster_df['university_name'].notna().sum() > 0:
        top_universities = cluster_df['university_name'].value_counts().head(2)
        if len(top_universities) > 0:
            primary_univ = top_universities.index[0]
            university_info = f" at {primary_univ}"
            if len(top_universities) > 1 and top_universities[1] > 10:
                university_info = " at Top Universities"
    
    # Create more descriptive domain info
    domain_info = "Academic" if domain_type == 'academic' else (
        "Corporate" if domain_type == 'corporate' else (
            "Personal" if domain_type == 'personal' else (
                "Government" if domain_type == 'government' else "Other")))
    
    # Create more specific audience descriptions
    if is_academic:
        audience_type = "Students"
        if "engineering" in keyword.lower():
            audience_type = "Engineering Students"
        elif "computer" in keyword.lower() or "it" in keyword.lower() or "tech" in keyword.lower():
            audience_type = "IT Students"
        elif "business" in keyword.lower() or "management" in keyword.lower():
            audience_type = "Business Students"
        elif "science" in keyword.lower():
            audience_type = "Science Students"
    else:
        audience_type = "Professionals"
        if "engineer" in keyword.lower():
            audience_type = "Engineers"
        elif "developer" in keyword.lower() or "programmer" in keyword.lower():
            audience_type = "Developers"
        elif "manager" in keyword.lower() or "executive" in keyword.lower():
            audience_type = "Managers"
    
    # Format the base name
    if is_academic:
        cluster_name = f"{keyword} {audience_type}{university_info}"
    else:
        cluster_name = f"{keyword} {audience_type} ({domain_info})"
    
    # Add "New" prefix for new imports if requested
    if is_new_import:
        cluster_name = f"New: {cluster_name}"
    
    # Get size information
    size = len(cluster_df)
    size_class = "Large" if size > 1000 else ("Medium" if size > 300 else "Small")
    
    # Determine engagement potential
    engagement = "High Engagement Potential" if is_academic and size > 300 else (
        "Moderate Engagement Potential" if domain_type == 'corporate' and size > 500 else "")
    
    # Create metadata
    metadata = {
        "size_classification": size_class,
        "engagement_potential": engagement,
        "primary_domain_type": domain_type,
        "primary_interest": keyword,
        "top_universities": top_universities.to_dict() if is_academic and len(top_universities) > 0 else {},
        "audience_description": f"{keyword}-focused {'students' if is_academic else 'professionals'}" +
                               (f" at {primary_univ}" if is_academic and 'primary_univ' in locals() else ""),
        "is_new_import": is_new_import
    }
    
    return cluster_name, metadata

def plot_cluster_metrics(kmodes_metrics, hierarchical_metrics):
    visualization_data = {}
    
    metrics_df = pd.DataFrame({
        'K-modes': [kmodes_metrics['silhouette'], kmodes_metrics['davies_bouldin'],
                    kmodes_metrics['calinski_harabasz']],
        'Hierarchical': [hierarchical_metrics['silhouette'], hierarchical_metrics['davies_bouldin'],
                         hierarchical_metrics['calinski_harabasz']]
    }, index=['Silhouette Score', 'Davies-Bouldin Index', 'Calinski-Harabasz Index'])

    for col in metrics_df.columns:
        for idx in metrics_df.index:
            if isinstance(metrics_df.loc[idx, col], str):
                metrics_df.loc[idx, col] = np.nan

    metrics_data = {
        'categories': metrics_df.index.tolist(),
        'series': [
            {
                'name': 'K-modes',
                'data': metrics_df['K-modes'].tolist()
            },
            {
                'name': 'Hierarchical',
                'data': metrics_df['Hierarchical'].tolist()
            }
        ]
    }
    
    plt.figure(figsize=(10, 6))
    titles = ['Silhouette Score\n(higher is better)', 'Davies-Bouldin Index\n(lower is better)',
              'Calinski-Harabasz Index\n(higher is better)']

    for i, metric in enumerate(['Silhouette Score', 'Davies-Bouldin Index', 'Calinski-Harabasz Index']):
        plt.subplot(1, 3, i + 1)
        metrics_df.loc[metric].plot(kind='bar', color=['#3498db', '#e74c3c'])
        plt.title(titles[i])
        plt.ylabel('Score')
        if i == 0:
            plt.ylim(0, 1)

    plt.tight_layout()
    visualization_data['metrics_chart'] = fig_to_base64(plt)
    plt.close()

    return metrics_df, metrics_data, visualization_data


# Main execution function
# Modify the main function to accept an is_new_import parameter
def main(file_path, is_new_import=False):
    result = {
        'visualization_data': {},
        'cluster_analysis': {},
        'metrics': {}
    }
    
    df = load_and_preprocess_data(file_path)
    df, X_kmodes, encoders = prepare_for_clustering(df)

    kmodes_clusters, kmodes_viz_data = find_optimal_k_with_metrics(X_kmodes, max_k=15)
    result['visualization_data'].update(kmodes_viz_data)
    
    stage1_clusters, kmode_model, kmodes_metrics = perform_kmodes_clustering(X_kmodes, kmodes_clusters)

    hierarchical_clusters, hierarchical_viz_data, Z, cached_gower_dm = find_optimal_hierarchical_clusters(df, stage1_clusters)
    result['visualization_data'].update(hierarchical_viz_data)
    
    stage2_clusters, hierarchical_metrics, hierarchical_viz_data2 = perform_hierarchical_clustering(
        df, stage1_clusters, hierarchical_clusters, Z=Z, gower_dm=cached_gower_dm
    )

    # 🔍 Compute t-SNE 2D coordinates using encoded feature matrix
    tsne_result = compute_tsne_coordinates(X_kmodes)
    df['x'] = tsne_result[:, 0]
    df['y'] = tsne_result[:, 1]
    df['z'] = 1  # Optional dummy for uniform z-axis

    result['visualization_data'].update(hierarchical_viz_data2)

    # Pass the is_new_import flag to analyze_clusters
    final_df, cluster_analysis, viz_data = analyze_clusters(df, stage1_clusters, stage2_clusters, is_new_import)
    
    result['cluster_analysis'] = cluster_analysis
    result['visualization_data'].update(viz_data)


    # Include t-SNE data in final output for React scatter chart
    result['tsne_data'] = df[['x', 'y', 'z', 'cluster_name', 'university_name']].to_dict(orient='records')
 
    metrics_df, metrics_data, metrics_viz_data = plot_cluster_metrics(kmodes_metrics, hierarchical_metrics)
    result['metrics'] = metrics_data
    result['visualization_data'].update(metrics_viz_data)
    
    print("\nClustering Evaluation Metrics:")
    print(metrics_df)

    print("\nClustering completed successfully!")

    result['clustered_data'] = final_df.to_dict(orient='records')
    
    return final_df, result


# Execute the clustering
if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description='Email Clustering with K-modes and Hierarchical Clustering')
    parser.add_argument('--file', type=str, default='email_data.csv', help='Path to input CSV file')
    parser.add_argument('--output', type=str, default='clustering_results.json', help='Path to output JSON file')

    args = parser.parse_args()
    final_df, result = main(file_path=args.file)

    with open(args.output, 'w') as f:
        json.dump(result, f)
        
    print(f"Results saved to {args.output}")
