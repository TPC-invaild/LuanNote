from fastapi import FastAPI
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

app.include_router(items.router)



@app.get("/")
async def root():
    return {"message":"hello world!"}
