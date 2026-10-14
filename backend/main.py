from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.routers import items
from backend.Store.ItemStore import load

@asynccontextmanager
async def lifespan(app:FastAPI):
    load()
    yield

app = FastAPI(
    title="LuanNote Backend",
    version="1.0",
    description="LuanNote API 文档",
    contact={
        "name":"Heng",
        "email":"hengmuon@google.com"
    },
    lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5501", "http://localhost:5501"],
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(items.router)



@app.get("/")
async def root():
    return {"message":"hello world!"}
