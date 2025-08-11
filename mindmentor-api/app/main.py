from fastapi import FastAPI
from .routers import users, journals, health

app = FastAPI(title="MindMentor API", version="0.1.0")

# Routers
app.include_router(health.router)
app.include_router(users.router)
app.include_router(journals.router)

@app.get("/")
async def root():
    return {"name": "MindMentor API", "ok": True}
