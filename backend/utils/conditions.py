from fastapi import HTTPException, Depends
from config import DEBUG_MODE
from utils.depends import getUser
import modules.db as database

db = database.Database()

async def gameStarted(user: database.User = Depends(getUser)) -> database.Game:

    if user.room.game.stage == 0: raise HTTPException(403, "Игра ещё не началась")

    return user.room.game

async def isOwner(user: database.User = Depends(getUser)) -> database.User:

    if not user.isowner: raise HTTPException(403)

    return user

async def validCountry(user: database.User = Depends(getUser), game: database.Game = Depends(gameStarted)) -> database.Country:

    if not user.country: raise HTTPException(403, "Ваша страна уничтожена")
    if not user.isleader: raise HTTPException(403, "Вы не президент")

    return user.country

async def isDebug(game: database.Game = Depends(gameStarted)) -> database.Game:

    if not DEBUG_MODE: raise HTTPException(403, "Разрешено только в дебаг режиме")