from modules.eventmanager import EventManager
import modules.db as db
from typing import List
import uuid, models

class Room:

    def __init__(self, maxcount: int, owner: "db.User", database: "db.Database", code: str):

        self.maxcount = maxcount
        self.owner = owner
        self.code = code
        self.db = database

        self.users: List[db.User] = []
        self.lastuserid = 0
        self.game = db.Game(self)
        self.eventmanager = EventManager(room = self)

    async def createUser(self, name: str) -> "db.User":

        if len(self.users) > self.maxcount: return False

        user = db.User(id = self.lastuserid + 1, name = name, token = str(uuid.uuid4()), room = self)

        self.users.append(user)
        self.lastuserid += 1

        return user
    
    async def delete(self):

        self.db.rooms.remove(self)
    
    async def getUser(self, id: int | str) -> "db.User":

        for user in self.users:
            if str(user.id) == str(id): return user

    def toPydanticModel(self) -> models.Room:

        return models.Room(
            owner = self.owner.toPydanticModel(), 
            maxcount = self.maxcount, 
            code = self.code, 
            started = self.game.stage > 0,
            users = [user.toPydanticModel() for user in self.users]
        )