from fastapi import FastAPI
from pydantic import BaseModel
from backend.Models.ItemModel import Item
from backend.routers.items import *

@asynccontextmanager
async def lifespan(app:FastAPI):
    load_store()
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