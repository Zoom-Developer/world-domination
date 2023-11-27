from fastapi import APIRouter, Depends
from models import Event
from utils.depends import getUser
from typing import List
import modules.db as database

EventRouter = APIRouter()
db = database.Database()

@EventRouter.get("")
async def get_last_event(user: database.User = Depends(getUser)) -> int:
    """
    Получение ID последнего ивента
    """

    return len(user.events) - 1

@EventRouter.get("/{before}")
async def get_events(before: int, user: database.User = Depends(getUser)) -> List[Event]:
    """
    Получение списка ивентов после определённого ID
    """

    return await user.room.eventmanager.getEvents(before, user)