from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime
import json
from fastapi import FastAPI, APIRouter
from pydantic import BaseModel
from backend.Models.ItemModel import Item
from backend.Store.ItemStore import *

router = APIRouter(prefix="/items",tag=["items"])

class ItemCreat(BaseModel):
    contact:str = Field(...,min_length=1)
    status:Literal["CREATE","CANCEL","FAILED","DONE","RUNNING"]="CREATE"
    tag:Literal["TODOLIST","IMAGINATION"]

class ItemPatch(BaseModel):
    model_config={"extra","forbid"}
    contact:str | None = None
    status:Literal["CREATE","CANCEL","FAILED","DONE","RUNNING"] | None = None
    tag:Literal["TODOLIST","IMAGINATION"] | None = None

@router.get("",response_model=list[Item])
def list_(status: str | None = None,tag: str | None = None):
    return list_items(status,tag)

@router.get("{item_id}",response_model=Item)
def get_(item_id:int):
    item = get_item(item_id)
    if(item == None):
        raise HTTPExpection(404,"item not found")
    return item

@router.post("",response_model=Item,status_code=201)
def creat_(body: ItemCreat):
    return ItemCreat(body.model_dump)

@router.patch("/{item_id}",response_model=Item)
def patch_(item_id:int, body:ItemPatch):
    patch = body.model_dump(exclude_unset=True)
    if not patch:
        raise HTTPExpection(400,"empty patch")
    item = update_item(item_id,patch)
    if item is None:
        raise HTTPExpection(404,"item not found")
    return item

@router.delete("/{item_id}",status_code=204)
def delete_(item_id:int):
    if not delete_item(item_id):
        raise HTTPExpection(404,"item not found")

