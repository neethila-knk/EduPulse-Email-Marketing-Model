import uvicorn

if __name__ == "__main__":
    # Pass the app as an import string "clustering_service:app"
    uvicorn.run("clustering_service:app", host="0.0.0.0", port=8000, reload=True)
