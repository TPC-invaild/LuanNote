from pydantic import BaseModel, Field
from typing import Literal
from fastapi import APIRouter, HTTPException
from backend.Models.ItemModel import Item
from backend.Store.ItemStore import list_items, get_item, creat_item, update_item, delete_item

router = APIRouter(prefix="/items",tags=["items"])

class ItemCreat(BaseModel):
    model_config={"str_strip_whitespace":True}
    contact:str = Field(...,min_length=1)
    status:Literal["CREATE","CANCEL","FAILED","DONE","RUNNING"]="CREATE"
    tag:Literal["TODOLIST","IMAGINATION"]

class ItemPatch(BaseModel):
    model_config={"extra":"forbid", "str_strip_whitespace":True}
    contact:str | None = Field(default=None, min_length=1)
    status:Literal["CREATE","CANCEL","FAILED","DONE","RUNNING"] | None = None
    tag:Literal["TODOLIST","IMAGINATION"] | None = None

@router.get("",response_model=list[Item])
def list_(status: str | None = None,tag: str | None = None):
    return list_items(status,tag)

@router.get("/{item_id}",response_model=Item)
def get_(item_id:int):
    item = get_item(item_id)
    if(item == None):
        raise HTTPException(404,"item not found")
    return item

@router.post("",response_model=Item,status_code=201)
def creat_(body: ItemCreat):
    return creat_item(body.model_dump())

@router.patch("/{item_id}",response_model=Item)
def patch_(item_id:int, body:ItemPatch):
    patch = body.model_dump(exclude_unset=True)
    if not patch:
        raise HTTPException(400,"empty patch")
    if any(value is None for value in patch.values()):
        raise HTTPException(422,"fields cannot be null")
    item = update_item(item_id,patch)
    if item is None:
        raise HTTPException(404,"item not found")
    return item

@router.delete("/{item_id}",status_code=204)
def delete_(item_id:int):
    if not delete_item(item_id):
        raise HTTPException(404,"item not found")
