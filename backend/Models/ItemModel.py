from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime
from time import time_ns


class Item(BaseModel):
    time:str=Field(default_factory=lambda:datetime.now().isoformat(timespec="seconds"))
    contact:str = Field(...,min_length=1)
    status:Literal["CREATE","CANCEL","FAILED","DONE","RUNNING"]
    tag:Literal["TODOLIST","IMAGINATION"]
    ID:int = Field(default_factory=lambda: time_ns() // 1_000)
    
    model_config={
        "extra":"forbid",
        "str_strip_whitespace":True,
        "frozen":True,
        "from_attributes":True
    }
