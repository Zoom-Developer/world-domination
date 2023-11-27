from fastapi import Request, Header, HTTPException, Depends, Path
from typing import Optional
from enums import CountryId
import modules.db as database

db = database.Database()

async def getUser(request: Request, token: Optional[str] = Header()) -> database.User:

    token = token if token else request.headers.get("Authorization")

    user = await db.getUser(token)
    if not user: raise HTTPException(401)

    return user

async def getCity(cityId: int = Path(ge=0, le=3), user: database.User = Depends(getUser)) -> database.City:

    return user.country.cities[cityId]

async def getCountry(countryId: CountryId, user: database.User = Depends(getUser)) -> database.Country:

    country = user.room.game.countries.get(countryId)
    if not country: raise HTTPException(404, "Страна не найдена")

    return country

async def getCityByCountry(cityId: int = Path(ge=0, le=3), country: database.Country = Depends(getCountry)) -> database.City:

    city = country.cities.get(cityId)
    if not city: raise HTTPException(404, "Город не найден")

    return city