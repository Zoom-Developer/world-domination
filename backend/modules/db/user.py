import modules.db as db
from enums import CountryId, EventType
from typing import Optional, List
import models

class User:

    def __init__(self, id: int, name: str, token: str, isowner: bool = False, isleader: bool = False, room: "db.Room" = None):

        self.id = id
        self.name = name
        self.token = token
        self.isleader = isleader
        self.isowner = isowner
        self.room = room

        self.country: db.Country | CountryId = None
        self.events: List[models.Event] = [] # For eventmanager
        self.ready = False # For manual round change

    async def changeUserCountryLeader(self) -> Optional["User"]:

        country_users = [usr for usr in self.room.users if usr.country and usr.country == self.country and usr != self]
        if self.isleader and country_users: 
            country_users[0].isleader = True
            return country_users[0]

    async def readyUser(self, ready: bool = True):

        self.ready = ready
        if self.room.game.ready_users == self.room.game.active_users_total:
            await self.room.game.nextStage()

    async def quit(self):

        index = self.room.users.index(self)
        self.room.users.pop(index)

        newleader = await self.changeUserCountryLeader()

        await self.room.eventmanager.addEvent(EventType.USER_QUITED, self.toPydanticModel())
        if newleader: await self.room.eventmanager.addEvent(EventType.USER_UPDATED, newleader.toPydanticModel())

        if self.room.game.winner_country != None and not self.room.users: await self.room.delete()

    def toPydanticModel(self, full = False) -> "models.User":

        return models.User(
            id = self.id,
            name = self.name,
            isowner = self.isowner,
            isleader = self.isleader,
            country = self.country.id if type(self.country) == db.Country else self.country,
            ready = self.ready if full else None,
        )