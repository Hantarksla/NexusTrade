from fastapi import APIRouter

router = APIRouter()

@router.get("/list")
async def list_strategies():
    return {"strategies": []}
