from fastapi import APIRouter, Depends, Body
from models import LoginResponse, Country, Game
from utils import getCountry, gameStarted
from enums import CountryId
import modules.db as database

DebugRouter = APIRouter()
db = database.Database()

@DebugRouter.put("/countries/{countryId}/money")
async def add_money(value: int = Body(embed = True), country: database.Country = Depends(getCountry), game: database.Game = Depends(gameStarted)) -> Country:
    """
    Выдача денежных средств стране
    """

    await country.addMoney(value)
    return country.toPydanticModel(True)

@DebugRouter.post("/start")
async def start_game(country: CountryId = Body(embed = True)) -> LoginResponse:
    """
    Создание лобби с начатой игрой
    """

    room = await db.createRoom(1, "Debug Owner")
    user = await room.createUser("Debug User")
    user.country = country
    user.isleader = True

    await room.game.start()

    return LoginResponse(user = user.toPydanticModel(True), room = room.toPydanticModel(), token = user.token)

@DebugRouter.post("/next")
async def next_stage(game: database.Game = Depends(gameStarted)) -> Game:

    await game.nextStage()

    return game.toPydanticModel()

@DebugRouter.patch("/stage")
async def set_stage(stage: int = Body(embed = True), game: database.Game = Depends(gameStarted)) -> Game:

    game.stage = stage - 1
    await game.nextStage()

    return game.toPydanticModel()