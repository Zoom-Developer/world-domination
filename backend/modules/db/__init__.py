from typing import List
from ..db.room import *
from ..db.user import *
from ..db.game import *
import uuid, random

def generateCode(length: int = 6) -> str:

    valid_letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return ''.join((random.choice(valid_letters) for i in range(length)))

class Database:

    # Singleton
    def __new__(cls):
        if not hasattr(cls, 'instance'):
            cls.instance = super(Database, cls).__new__(cls)
        return cls.instance

    def __init__(self):

        self.rooms: List[Room] = []

    async def createRoom(self, maxcount: int, ownername: str) -> Room:

        owner = User(id = 0, name = ownername, token = str(uuid.uuid4()), isowner = True)
        room = Room(maxcount = maxcount, owner = owner, code = generateCode(6), database = self)
        owner.room = room

        self.rooms.append(room)

        return room
    
    async def getUser(self, token: str) -> User:

        for room in self.rooms:
            if room.owner.token == token: return room.owner
            for user in room.users:
                if user.token == token:
                    return user
    
    async def getRoom(self, code: str) -> Room:

        room = [room for room in self.rooms if room.code == code] # Find room by code

        return room[0] if room else None