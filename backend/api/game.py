from fastapi import APIRouter, HTTPException, Depends, Body
from models import Game, City, Country
from enums import CityUpgradeType, CountryUpgradeType, EventType
from utils import getUser, getCity, getCityByCountry, getCountry, gameStarted, isOwner, validCountry
from config import PRICES, DEBUG_MODE
import modules.db as database

GameRouter = APIRouter()
db = database.Database()

@GameRouter.post("/start")
async def start_game(user: database.User = Depends(isOwner)) -> Game:
    """
    Запуск игры
    """

    if user.room.game.stage > 0: raise HTTPException(403, "Игра уже запущена")
    if len(user.room.users) < 2 and not DEBUG_MODE: raise HTTPException(403, "Для запуска игры необходимо хотя-бы 2 игрока")

    res = await user.room.game.start()
    if not res: raise HTTPException(403, "Не все игроки выбрали страну")

    return user.room.game.toPydanticModel()

@GameRouter.post("/next")
async def next_stage(user: database.User = Depends(isOwner), game: database.Game = Depends(gameStarted)) -> Game:
    """
    Ручная смена раунда
    """

    await game.nextStage()

    return game.toPydanticModel(user = user)

@GameRouter.post("/country/{countryId}/money")
async def send_money(user: database.User = Depends(isOwner), value: int = Body(embed=True), country: database.Country = Depends(getCountry)) -> Country:
    """
    Отправка денег стране
    """

    await country.addMoney(value)

    return country.toPydanticModel(True)

@GameRouter.get("")
async def get_game_info(user: database.User = Depends(getUser), game: database.Game = Depends(gameStarted)) -> Game:
    """
    Получение информации о игре
    """

    return game.toPydanticModel(user = user)

@GameRouter.patch("/country/cities/{cityId}")
async def upgrade_city(upgrade_type: CityUpgradeType = Body(embed=True), city: database.City = Depends(getCity), country: database.Country = Depends(validCountry)) -> City:
    """
    Улучшение города
    """

    if (city.upgrade_price if upgrade_type == CityUpgradeType.LEVEL_UPGRADE else PRICES[upgrade_type]) > country.balance: raise HTTPException(403, "Недостаточно средств")

    res = await city.upgrade(upgrade_type)
    if not res: raise HTTPException(403, "Невозможно купить данное улучшение")

    return city.toPydanticModel(True)

@GameRouter.patch("/country")
async def upgrade_country(upgrade_type: CountryUpgradeType = Body(embed=True), country: database.Country = Depends(validCountry)) -> Country:
    """
    Улучшение страны
    """

    if PRICES[upgrade_type] > country.balance: raise HTTPException(403, "Недостаточно средств")

    res = await country.upgrade(upgrade_type)
    if not res: raise HTTPException(403, "Невозможно купить данное улучшение")

    return country.toPydanticModel(True)

@GameRouter.post("/country/{countryId}/cities/{cityId}/nuclear")
async def nuclear_attack(country: database.Country = Depends(validCountry), city: database.City = Depends(getCityByCountry)) -> City:
    """
    Выполнение ядерного удара по выбранному городу
    """

    if country == city.country: raise HTTPException(403, "Вы не можете нанести удар по своей стране")

    res = await country.nuclearAttack(city)
    if not res: raise HTTPException(403, "У вас отсутствует ядерное вооружение")

    return city.toPydanticModel(False)

@GameRouter.post("/country/{countryId}/sanctions")
async def send_sanction(country: database.Country = Depends(validCountry), target: database.Country = Depends(getCountry)) -> Country:
    """
    Наложение санкции на страну
    """

    if country.sanction_sended: raise HTTPException(403, "Вы уже наложили санкции в этом раунде")
    if target == country: raise HTTPException(403, "Вы не можете наложить санкции на свою страну")
    if PRICES["send_sanction"] > country.balance: raise HTTPException(403, "Недостаточно средств")
    
    res = await country.sendSanction(target)
    if not res: raise HTTPException(403, "Невозможно наложить санкции")

    return target.toPydanticModel(False)

@GameRouter.put("/country/{countryId}")
async def transfer_money(value: int = Body(embed = True), country: database.Country = Depends(validCountry), target: database.Country = Depends(getCountry)) -> Country:
    """
    Перевод денежных средств стране
    """

    if target == country: raise HTTPException(403, "Вы не можете совершить перевод своей стране")
    if value > country.balance: raise HTTPException(403, "Недостаточно средств")
    
    res = await country.transferMoney(target, value)
    if not res: raise HTTPException(403, "Невозможно совершить перевод")

    return target.toPydanticModel(False)

@GameRouter.post("/ecology")
async def donate_ecology(country: database.Country = Depends(validCountry), user: database.User = Depends(getUser)) -> Game:
    """
    Вклад в экологию
    """

    res = await country.game.donateEcology(country)
    if not res: raise HTTPException(403, "Недостаточно средств")

    return country.game.toPydanticModel(user = user)

# @GameRouter.post("/country/{countryId}/spy")
# async def country_spy(target: database.Country = Depends(getCountry), country: database.Country = Depends(validCountry)) -> Country:
#     """
#     Шпионаж за страной
#     """

