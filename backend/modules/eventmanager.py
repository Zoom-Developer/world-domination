from typing import List, Any
from enums import EventType
import modules.db as db
import models

class EventManager:

    def __init__(self, room: "db.Room"):

        self.room = room

        self.stage_events: List[models.Event] = []

    async def addEvent(self, type: EventType, data: Any = None, targets: List["db.User"] = None):

        if not targets: targets = self.room.users + [self.room.owner]
        if self.room.owner not in targets: targets.append(self.room.owner)
        for target in targets:
            target.events.append(models.Event(
                id = len(target.events),
                type = type,
                data = data
            ))
    
    async def addStageEvent(self, type: EventType, data: Any) -> int:

        self.stage_events.append(models.Event(
            id = len(self.stage_events),
            type = type,
            data = data,
        ))

        return len(self.stage_events)

    async def getEvents(self, before: int, user: "db.User") -> List[models.Event]:

        return user.events[before:]
    
    async def getStageEvents(self) -> List[models.Event]:

        return self.stage_events
    
    async def clearStageEvents(self):

        self.stage_events.clear()