from fastapi import FastAPI
from .routers import users, journals, health, auth
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI(title="MindMentor API", version="0.1.0")

origins = [
    "http://localhost:5173",   # Vite dev server
    "http://localhost:3000",   # (optional)
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # allow all during dev
    allow_credentials=False,      # must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=86400,  
)

# Routers
app.include_router(health.router)
app.include_router(users.router)
app.include_router(journals.router)
app.include_router(auth.router)


@app.get("/")
async def root():
    return {"name": "MindMentor API", "ok": True}
