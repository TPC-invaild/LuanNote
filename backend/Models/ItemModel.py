from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime
import json


class Item(BaseModel):
    time:str=Field(default_factory=lambda:datetime.now().isoformat(timespec="seconds"))
    contact:str = Field(...,min_length=1)
    status:Literal["CREATE","CANCEL","FAILED","DONE","RUNNING"]
    tag:Literal["TODOLIST","IMAGINATION"]
    ID:int = Field(default_factory=基于时间生成的字段)
    
    model_config={
        "extra":"forbid",
        "str_strip_whitespace":True,
        "frozen":True,
        "from_attributes":True
    }