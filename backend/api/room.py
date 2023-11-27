from fastapi import APIRouter, HTTPException, Depends, Body
from models import LoginResponse, Room
from enums import EventType
from utils.depends import getUser
import modules.db as database

RoomRouter = APIRouter()
db = database.Database()

@RoomRouter.post("")
async def create_room(maxcount: int = Body(embed = True, ge = 2, le = 30), ownername: str = Body(embed = True)) -> LoginResponse:
    """
    Создание новой комнаты
    """

    room = await db.createRoom(maxcount = maxcount, ownername = ownername)

    return LoginResponse(
        user = room.owner.toPydanticModel(),
        room = room.toPydanticModel(),
        token = room.owner.token
    )

@RoomRouter.post("/{code}")
async def login_room(code: str, name: str = Body(embed = True)) -> LoginResponse:
    """
    Вход в комнату
    """

    room = await db.getRoom(code)

    if not room: raise HTTPException(404, "Неверная комната")
    if room.game.stage > 0: raise HTTPException(403, "Игра уже началась")
    
    user = await room.createUser(name)
    if not user: raise HTTPException(403, "Комната заполнена")

    await room.eventmanager.addEvent(
        type = EventType.USER_JOINED, 
        data = user.toPydanticModel()
    )

    return LoginResponse(
        user = user.toPydanticModel(),
        room = room.toPydanticModel(), 
        token = user.token
    )

@RoomRouter.get("")
async def room_info(user: database.User = Depends(getUser)) -> Room:
    """
    Получение информации о комнате
    """

    return user.room.toPydanticModel()
