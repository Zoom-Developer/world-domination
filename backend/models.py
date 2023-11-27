import pydantic as pd
from enums import EventType, CountryId
from datetime import datetime
from config import PRICES, MAXIMUM_CITY_LEVEL
from typing import List, Any, Dict, Union

# ------------------------------------------------
# Response Models
# ------------------------------------------------

class City(pd.BaseModel):

    id: int
    title: str
    country: CountryId
    level: int | None
    income: int | None
    air_defense: bool | None

class User(pd.BaseModel):

    id: int
    name: str
    country: CountryId | None
    ready: bool | None
    isleader: bool
    isowner: bool

class Log(pd.BaseModel):

    time: datetime
    text: str

class Country(pd.BaseModel):

    id: str
    balance: int | None
    income: int | None
    sanctions: List[CountryId] | None
    ecology_total: int | None
    # economy_progress: int | None
    nuclear_rockets: int | None
    nuclear_reactor: bool | None
    logs: List[Log] | None
    users: List[User]
    cities: Dict[int, City]

class GameConfig(pd.BaseModel):

    NUCLEAR_ROCKET_PRICE: int = PRICES['nuclear_rocket']
    NUCLEAR_REACTOR_PRICE: int = PRICES['nuclear_reactor']
    AIR_DEFENSE_PRICE: int = PRICES['air_defense']
    LEVEL_UPGRADE_PRICE: int = PRICES['level_upgrade']
    DONATE_ECOLOGY: int = PRICES['donate_ecology']
    SEND_SANCTION: int = PRICES['send_sanction']
    MAX_CITY_LEVEL: int = MAXIMUM_CITY_LEVEL

class Sanction(pd.BaseModel):

    sender: Country
    receiver: Country

class MeetingData(pd.BaseModel):

    destroyed_cities: List[City]
    destroyed_countries: List[Country]
    defended_cities: List[City]
    sanctions: List[Sanction]
    ecology_donates: List[Country]

class Game(pd.BaseModel):

    stage: int
    countries: List[Country]
    ecology: int
    stage_end: datetime
    ready_users: int
    total_users: int
    meeting: MeetingData | None
    winner: Union[Country, int, None]
    config: GameConfig = GameConfig()

class Room(pd.BaseModel):

    owner: User
    maxcount: int
    code: str
    started: bool
    users: List[User]

class LoginResponse(pd.BaseModel):

    user: User
    room: Room
    token: str

class Event(pd.BaseModel):

    id: int = None
    type: EventType
    data: Any