if __name__ == "__main__":
    import uvicorn
    from src import config

    uvicorn.run("src.main:app", host="0.0.0.0", port=config.PORT, reload=True)
