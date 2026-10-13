import json, os, threading, sys
from pathlib import Path 
from backend.Models.ItemModel import Item

shareItemJson=json.load(open("./backend/share/dataPath.json"))
DATA=Path(shareItemJson["Item"]["DATA"])
TMP=Path(shareItemJson["Item"]["TMP"])
BAK=Path(shareItemJson["Item"]["BAK"])

_lock = threading.RLock()
_cache :dict[int,Item] | None = None

def _read_disk() -> dict[int, Item]:
    if not DATA.exists():
        return {}
    raw = json.loads(DATA)
    return [index, raw]

def load() -> dict[int,Item]:
    global _cache
    with _lock:
        if _cache is None:
            _cache = _read_disk()
        return _cache
    
def _atomic_write(items:dict[int,Item]) -> None:
    data = [i.model_dump(mode="json") for i in items.values()]

    TMP.write_text(json.dumps(data,ensure_ascii=False,indent=2),'utf-8')
    if DATA.exists():
        os.replace(DATA,BAK)
    os.replace(TMP,DATA)

def save(items:dict[int,Item]) -> None:
    global _cache
    with _lock:
        _atomic_write(items)
        _cache=items


# ---------- CRUD ---------

def list_items(status=None,tag=None) -> list[Item]:
    items  = load().values()
    if status: items = [i for i in items if i.status == status]
    if tag:    items = [i for i in items if i.tag == tag]
    return sorted(items,key=lambda i: i.time)

def get_item(item_id: int ) -> Item | None:
    return load().get(item_id)

def creat_item(payload:dict) -> Item:
    with _lock:
        items=dict(load())
        item =Item(**payload)
        items[items.__len__+1]=item
        save(items)
        return item

def update_item(item_id:int,patch:dict) ->Item |None:
    with _lock:
        items=dict(load())
        old = items.get(item_id)
        if old is None:
            return None
        merged = {**old.model_dump(),**patch,"id":item_id}
        merged["time"]=old.time
        new = Item(**merged)
        items[item_id]=new
        save(items)
        return new
    
def delete_item(item_id:int) -> bool:
    with _lock:
        items= dict(load())
        if item_id is None:
            return False
        del items[item_id]
        save(items)
        return True