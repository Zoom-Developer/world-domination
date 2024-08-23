from enum import Enum

class CityUpgradeType(str, Enum):

    LEVEL_UPGRADE = "level_upgrade"
    AIR_DEFENSE = "air_defense"

class CountryUpgradeType(str, Enum):


    NUCLEAR_REACTOR = "nuclear_reactor"
    NUCLEAR_ROCKET = "nuclear_rocket"

class EventType(str, Enum):

    # USER TYPES
    USER_JOINED = "newuser"
    USER_UPDATED = "updateuser"
    USER_QUITED = "quituser"
    USER_READY = "readyuser"

    # GAME TYPES
    GAME_STARTED = "startgame"
    GAME_ENDED = "endgame"
    GAME_ROUND_CHANGED = "nextround"
    
    # COUNTRY TYPES
    COUNTRY_UPGRADE = "upgradecountry"
    COUNTRY_TRANSFER = "transfermoney"
    COUNTRY_SPY = "countryspy"

    # STAGE EVENT TYPES
    NUCLEAR_ATTACK = "nuclearattack"
    SEND_SANCTION = "sendsanction"
    DONATE_ECOLOGY = "ecologydonate"
    REACTOR_CREATED = "createdreactor"

class CountryId(str, Enum):

    ru = "ru"
    cn = "cn"
    sp = "sp"
    de = "de"
    us = "us"
    fr = "fr"
    lt = "lt"
    rk = "rk"
    jp = "jp"
    by = "by"
    ng = "ng"
    pa = "pa"
    pr = "pr"