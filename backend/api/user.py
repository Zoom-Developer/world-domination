from fastapi import APIRouter, HTTPException, Depends, Body
from models import User
from enums import EventType, CountryId
from utils import getUser, gameStarted
import modules.db as database

UserRouter = APIRouter()
db = database.Database()

@UserRouter.patch("/{targetId}")
async def room_user_patch(targetId: str, country: CountryId = Body(embed=True, default=None), ready: bool = Body(embed=True, default=None), user: database.User = Depends(getUser)) -> User:
    """
    Обновление данных пользователя
    """

    if targetId != "@me" and not user.isowner: raise HTTPException(403)
    elif targetId != "@me": target = await user.room.getUser(targetId)
    else: target = user

    if not target: raise HTTPException(404, "Неверный пользователь")
    if target.isowner: raise HTTPException(403, "Ведущий не может ставить страну")
    if country and target.room.game.stage > 0: raise HTTPException(403, "Игра уже началась")
    if ready and target.room.game.stage < 1: raise HTTPException(403, "Игра ещё не началась")
    if target.country == country: raise HTTPException(403, "Вы уже выбрали эту страну")

    if country != None:

        newleader = await user.changeUserCountryLeader()

        target.isleader = country not in [usr.country for usr in user.room.users if usr.country]
        target.country = country

        await user.room.eventmanager.addEvent(
            type = EventType.USER_UPDATED, 
            data = [target.toPydanticModel()] + ([newleader.toPydanticModel()] if newleader else [])
        )
    
    if ready != None:

        await user.readyUser(ready)

        await user.room.eventmanager.addEvent(
            type = EventType.USER_READY,
            data = user.room.game.ready_users
        )

    return target.toPydanticModel(True)

@UserRouter.get("")
async def get_user(user: database.User = Depends(getUser)) -> User:
    """
    Получение информации о пользователе
    """

    return user.toPydanticModel(True)

@UserRouter.delete("/{targetId}")
async def delete_user(targetId: str, user: database.User = Depends(getUser)) -> User:
    """
    Выход пользователя или удаление комнаты
    """

    if targetId != "@me" and not user.isowner: raise HTTPException(403)
    elif targetId != "@me": target = await user.room.getUser(targetId)
    else: target = user

    if not target: raise HTTPException(404, "Неверный пользователь")

    if target.isowner: await target.room.delete()
    else: await target.quit()

    return target.toPydanticModel()