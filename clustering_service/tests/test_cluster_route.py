import os
import pathlib
import sys
import tempfile
import pandas as pd
import pytest
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager

# Add the parent folder to sys.path
sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))

from clustering_service import app

@pytest.mark.asyncio
async def test_cluster_endpoint_with_sample_csv():
    df = pd.DataFrame({
        "Email": ["student1@university.edu", "test@gmail.com", "info@institute.ac.lk"],
        "Keyword Category": ["AI", "Marketing", "Data Science"]
    })
    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".csv")
    df.to_csv(tmp_file.name, index=False)
    tmp_file.close()

    transport = ASGITransport(app=app)  # ✅ use ASGITransport instead of app=...

    async with LifespanManager(app):  # ✅ handle startup/shutdown events
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            with open(tmp_file.name, "rb") as f:
                response = await client.post(
                    "/cluster",
                    files={"file": ("test.csv", f, "text/csv")},
                    params={"is_new_import": True}
                )

    os.remove(tmp_file.name)

    assert response.status_code == 200
    json_data = response.json()
    assert "records" in json_data
    assert "cluster_analysis" in json_data
    assert "metrics" in json_data
