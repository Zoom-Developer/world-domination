from typing import Dict, List
from datetime import datetime, timedelta
from collections import deque
from errors.game import NotEnoughMoney, NuclearAlreadySended
from config import *
from enums import EventType, CityUpgradeType, CountryUpgradeType, CountryId
from config import PRICES, ROUND_TIME
import modules.db as db
import models, asyncio

class City:

    def __init__(self, title: str, id: int, country: "Country", capital: bool = False):

        self.title = title
        self.id = id
        self.country = country
        self.capital = capital
        
        self.level = DEFAULT_CITY_LEVEL
        if self.capital: self.level += 1
        self.air_defense = False

    async def upgrade(self, type: CityUpgradeType) -> bool:

        if not self.country.game.actions_accessed: return False

        match type:

            case CityUpgradeType.LEVEL_UPGRADE: 
                if self.level >= MAXIMUM_CITY_LEVEL + (1 if self.capital else 0): return False
                if self.country.balance < self.upgrade_price: raise NotEnoughMoney
                self.country.balance -= self.upgrade_price
                self.level += 1
                await self.country.addLog("Уровень города <b>%s</b> повышен до %s" % (self.title, self.level))

            case CityUpgradeType.AIR_DEFENSE:
                if self.air_defense: return False
                if self.country.balance < PRICES["air_defense"]: raise NotEnoughMoney
                self.air_defense = True
                self.country.balance -= PRICES["air_defense"]
                await self.country.addLog("Куплено ПВО для города <b>%s</b>" % self.title)
    
        await self.country.sendUpdateEvent()

        return True
    
    async def delete(self):

        del self.country.cities[self.id]

    @property
    def upgrade_price(self):

        return PRICES["level_upgrade"] + (CITY_PRICE_RAISE * (self.level - 1))

    @property
    def income(self):

        income = DEFAULT_CITY_INCOME * (self.country.game.ecology / 100) + (CITY_INCOME_RAISE * (self.level - 1))
        income -= SANCTION_EFFECT * len(self.country.sanctions) * income
        return round(income)

    def toPydanticModel(self, full: bool = True) -> models.City:

        return models.City(
            id = self.id,
            title = self.title,
            country = self.country.id,
            capital = self.capital,
            level = self.level if full else None,
            income = self.income if full else None,
            air_defense = self.air_defense if full else None
        )

class Country:

    def __init__(self, country: CountryId, game: "Game", users: List["db.User"] = None):
        
        self.id = country
        self.game = game
        self.users = users if users else []

        self.balance = DEFAULT_BALANCE
        self.logs: List[models.Log] = deque(maxlen = 20)
        self.sanctions: List[Country] = []
        self.sanction_sended = False
        self.spy_country: models.Country
        self.ecology_count = 0
        self.nuclear_rockets = 0
        self.nuclear_reactor = False
        self.nuclear_reactor_creating = False
        self.nuclear_sended: list[City] = []
        self.ready = False
        self.cities = {i: City(title, i, self, i == 0) for i, title in enumerate(CITIES[country])}

    async def addUser(self, user: "db.User"):

        self.users.append(user)
        user.country = self

    async def upgrade(self, type: CountryUpgradeType) -> bool:

        if not self.game.actions_accessed: return False
        if self.balance < PRICES[type.value]: raise NotEnoughMoney

        match type:

            case CountryUpgradeType.NUCLEAR_REACTOR:
                if self.nuclear_reactor or self.nuclear_reactor_creating: return False
                self.nuclear_reactor_creating = True
                await self.game.room.eventmanager.addStageEvent(type = EventType.REACTOR_CREATED, data = self)
                await self.addLog("Приобретён <b>ядерный реактор</b>")

            case CountryUpgradeType.NUCLEAR_ROCKET:
                if not self.nuclear_reactor or self.nuclear_rockets >= 10: return False
                self.nuclear_rockets += 1
                await self.addLog("Приобретена <b>ядерная боеголовка</b> (Всего: %s)" % self.nuclear_rockets)

        self.balance -= PRICES[type.value]
        await self.sendUpdateEvent()

        return True
    
    async def spy(self, target: "db.Country") -> bool:

        if not self.game.actions_accessed: return False

        self.spy_country = target.toPydanticModel(True)
        self.balance -= PRICES["country_spy"]

        await self.game.room.eventmanager.addEvent(
            type = EventType.COUNTRY_SPY,
            data = self.spy_country
        )

    async def nuclearAttack(self, city: City) -> bool:

        if not self.nuclear_rockets or not self.game.actions_accessed: return False
        if city in self.nuclear_sended: raise NuclearAlreadySended

        self.nuclear_rockets -= 1
        self.nuclear_sended.append(city)

        log = await self.addLog("Запущена ядерная боеголовка на город <b>%s</b>" % city.title)
        
        await self.game.room.eventmanager.addStageEvent(type = EventType.NUCLEAR_ATTACK, data = {"attacker": self, "attacked": city})
        await self.game.room.eventmanager.addEvent(type = EventType.NUCLEAR_ATTACK, data = {
            "attacker": self.toPydanticModel(True),
            "attacked": city.toPydanticModel(False),
            "log": log
        }, targets = self.users)

        return True
    
    async def sendSanction(self, country: "Country") -> bool:

        if not self.game.actions_accessed: return False

        self.sanction_sended = True
        self.balance -= PRICES["send_sanction"]
        country.sanctions.append(self)

        log = await self.addLog("<b>%s</b> наложил санкции на <b>%s</b>" % (self.id.value, country.id.value))
        await country.addLog(log.text)

        await self.game.room.eventmanager.addStageEvent(type = EventType.SEND_SANCTION, data = { "sender": self, "receiver": country })
        await self.game.room.eventmanager.addEvent(type = EventType.SEND_SANCTION, data = {
            "sender": self.id,
            "receiver": country.id
        }, targets = country.users + self.users)
        await self.sendUpdateEvent()
        await country.sendUpdateEvent()

        return True

    async def transferMoney(self, target: "Country", value: int) -> bool:

        if not self.game.actions_accessed: return False
        if self.balance < value: raise NotEnoughMoney

        self.balance -= value
        target.balance += value

        log = await self.addLog("<b>%s</b> перевёл <b>%s</b> %s$" % (self.id.value, target.id.value, value))
        await target.addLog(log.text)
        await self.game.room.eventmanager.addEvent(
            type = EventType.COUNTRY_TRANSFER,
            data = {
                "sender": self.id,
                "receiver": target.id,
                "value": value
            },
            targets = self.users + target.users
        )
        await self.sendUpdateEvent()
        await target.sendUpdateEvent()
        
        return True
    
    async def addMoney(self, value: int, log: str):

        self.balance += value
        if log: await self.addLog(log)
        await self.sendUpdateEvent()
    
    async def addLog(self, text: str) -> models.Log:

        log = models.Log(time = datetime.utcnow(), text = text)
        self.logs.append(log)

        return log

    async def sendUpdateEvent(self):

        await self.game.room.eventmanager.addEvent(
            type = EventType.COUNTRY_UPGRADE, 
            data = self.toPydanticModel(), 
            targets = self.users
        )

    async def delete(self):

        del self.game.countries[self.id]
        for user in self.users:
            user.country = None

    @property
    def income(self) -> int:

        return sum([city.income for city in self.cities.values()])
    
    @property
    def cities_count(self) -> int:

        return max([city.id for city in self.cities.values()]) + 1
    
    @property
    def total_level(self) -> int:

        return sum([city.level for city in self.cities.values()])
    
    # @property
    # def economy_progress(self) -> int:

    #     return (sum([city.level for city in self.cities.values()]) - self.cities_count) / (self.cities_count * MAXIMUM_CITY_LEVEL - self.cities_count) * 100

    def toPydanticModel(self, full: bool = True) -> models.Country:

        return models.Country(
            id = self.id,
            balance = self.balance if full else None,
            users = [user.toPydanticModel() for user in self.users],
            nuclear_rockets = self.nuclear_rockets if full else None,
            nuclear_reactor = self.nuclear_reactor if full else None,
            nuclear_reactor_creating = self.nuclear_reactor_creating if full else None,
            ecology_total = self.ecology_count if full else None,
            income = self.income if full else None,
            # economy_progress = self.economy_progress if full else None,
            sanctions = [country.id for country in self.sanctions] if full else None,
            logs = self.logs if full else None,
            cities = {i: city.toPydanticModel(full) for i, city in self.cities.items()}
        )
    
class Game:

    def __init__(self, room: "db.Room"):
        
        self.room = room

        self.countries: Dict[str, Country] = {}
        self.stage = 0
        self.stage_end: datetime = None
        self.meeting_stage = False
        self.winner_country: Country = None
        self.ecology = 100
        self.ecology_count = 0

        self.tasks = set()
    
    async def roundTimer(self, stage: int):

        while True:
            if self.stage != stage or self.meeting_stage: break

            if datetime.utcnow() >= self.stage_end:
                await self.nextStage()
                break

            await asyncio.sleep(1)
            
    async def startTimer(self):

        task = asyncio.create_task(self.roundTimer(self.stage))
        self.tasks.add(task)
        task.add_done_callback(lambda res: self.tasks.remove(task))
    
    async def createCountry(self, country_code: str, users: List["db.User"] = None) -> Country:

        country = Country(country = country_code, game = self, users = users if users else None)
        self.countries[country_code] = country

        return country
    
    async def getCountry(self, country_code: str) -> Country:

        return self.countries.get(country_code, None)

    def getMeetingData(self, user: "db.User" = None) -> models.MeetingData:

        return models.MeetingData(
            defended_cities = [data for data in self._meeting_data["defended_cities"] if not user or user.isowner or data.country == user.country.id],
            destroyed_cities = self._meeting_data["destroyed_cities"],
            destroyed_countries = self._meeting_data["destroyed_countries"],
            sanctions = self._meeting_data["sanctions"],
            ecology_donates = self._meeting_data["ecology_donates"],
            countries_progress = self._meeting_data["countries_progress"]
        )
    
    async def endGame(self):

        self.winner_country = max(self.countries.values(), key = lambda country: country.total_level, default = -1)
        if isinstance(self.winner_country, Country): self.winner_country = self.winner_country.toPydanticModel()
        await self.room.eventmanager.addEvent(
            type = EventType.GAME_ENDED
        )

    async def meetingStage(self):

        self._meeting_data = {"defended_cities": [], "destroyed_countries": [], "destroyed_cities": [], "sanctions": [], "ecology_donates": [], "countries_progress": {}}
        for event in await self.room.eventmanager.getStageEvents():

            match event.type:

                case EventType.NUCLEAR_ATTACK:

                    attacker: Country = event.data['attacker']
                    attacked: City = event.data['attacked']

                    if attacked.country.id not in self.countries or attacked.id not in attacked.country.cities: continue
                    
                    if attacked.air_defense: 
                        self._meeting_data["defended_cities"].append(attacked.toPydanticModel(False))
                        await attacked.country.addLog("Город <b>%s</b> пережил ядерный удар" % attacked.title)
                        attacked.air_defense = False
                    else:
                        self._meeting_data["destroyed_cities"].append(attacked.toPydanticModel(False))
                        await attacked.country.addLog("Город <b>%s</b> был уничтожен" % attacked.title)
                        await attacked.delete()
                        if not attacked.country.cities:
                            self._meeting_data["destroyed_countries"].append(attacked.country.toPydanticModel(False))
                            await attacked.country.delete()
                    self.ecology += NUCLEAR_ROCKET_ECOLOGY

                case EventType.SEND_SANCTION:

                    self._meeting_data['sanctions'].append(models.Sanction(
                        sender = event.data['sender'].toPydanticModel(False), 
                        receiver = event.data['receiver'].toPydanticModel(False)
                    ))

                case EventType.DONATE_ECOLOGY:

                    self.ecology += DONATE_ECOLOGY
                    self._meeting_data['ecology_donates'].append(event.data.toPydanticModel(False))

                case EventType.REACTOR_CREATED:

                    country: Country = event.data
                    country.nuclear_reactor_creating = False
                    country.nuclear_reactor = True
                    self.ecology += NUCLEAR_REACTOR_ECOLOGY

        countries_progress = {country.id: country.total_level for country in self.countries.values()}
        self._meeting_data['countries_progress'] = {
            country: value / sum(countries_progress.values())
            for country, value in sorted(countries_progress.items(), key=lambda x: x[1], reverse=True)
        }
        
        await self.room.eventmanager.clearStageEvents()
        self.meeting_stage = True

        await self.room.eventmanager.addEvent(
            type = EventType.GAME_ROUND_CHANGED,
            data = True # Meeting bool
        )

    async def nextStage(self):

        if not self.meeting_stage: return await self.meetingStage()
        if self.stage >= END_STAGE or len(self.countries) <= (1 if not DEBUG_MODE else 0): return await self.endGame()

        for country in self.countries.values(): 
            country.balance += country.income
            country.ecology_count = 0
            country.sanction_sended = False
            country.nuclear_sended.clear()
            country.sanctions.clear()
            await country.addLog("Начался %s раунд" % (self.stage + 1))
        for user in self.room.users: user.ready = False

        self.stage += 1
        self.meeting_stage = False
        self.stage_end = datetime.utcnow() + timedelta(seconds = ROUND_TIME)
        await self.startTimer()

        await self.room.eventmanager.addEvent(
            type = EventType.GAME_ROUND_CHANGED,
            data = False # Meeting bool
        )

    async def start(self) -> bool:

        if self.stage == 0:

            if [user for user in self.room.users if not user.country]: return False # Check country selection by all users

            self.stage = 1

            # Create countries
            for user in self.room.users:
                if user.country not in self.countries: 
                    country = await self.createCountry(user.country)
                    await country.addLog("Игра началась")
                else: country = await self.getCountry(user.country)
                await country.addUser(user)

            self.stage_end = datetime.utcnow() + timedelta(seconds = ROUND_TIME)
            await self.startTimer()

            await self.room.eventmanager.addEvent(
                type = EventType.GAME_STARTED,
                data = self.toPydanticModel()
            )

            return True
        
        else: return False

    async def callOwner(self, country: Country) -> None:

        if not self.actions_accessed: return False
        await country.addLog("<b style='color: #0ba2e9;'>Страна вызывает ведущего</b>")
        await self.room.eventmanager.addEvent(
            type = EventType.COUNTRY_CALL_OWNER,
            data = country.toPydanticModel(True),
            targets = country.users
        )

    async def donateEcology(self, country: Country) -> bool:

        if not self.actions_accessed: return False
        price = PRICES['donate_ecology'] + (country.ecology_count * DONATE_ECOLOGY_RAISE * PRICES['donate_ecology'])

        if country.balance < price: return False
        
        country.balance -= price
        country.ecology_count += 1

        await country.addLog("Внесён вклад в экологию")
        
        await self.room.eventmanager.addStageEvent(
            type = EventType.DONATE_ECOLOGY,
            data = country
        )
        await self.room.eventmanager.addEvent(type = EventType.DONATE_ECOLOGY, data = country.toPydanticModel(True), targets = country.users)

        return True
    
    # async def get_all_logs(self) -> list[models.Log]:
    #     logs = []
    #     for country in self.countries.values():
    #         logs += country.logs
    #     return logs
    
    @property
    def actions_accessed(self) -> bool:

        return not self.meeting_stage and not self.winner_country
    
    @property
    def ready_users(self) -> int:
        
        return len([user for user in self.room.users if user.ready and user.country])
    
    @property
    def active_users_total(self) -> int:

        return len([user for user in self.room.users if user.country])
        
    
    def toPydanticModel(self, user: "db.User" = None) -> models.Game:

        return models.Game(
            stage = self.stage,
            countries = [country.toPydanticModel(not user or user.country == country or user.isowner or self.winner_country) for country in self.countries.values()],
            stage_end = self.stage_end,
            ecology = self.ecology,
            ready_users = self.ready_users,
            total_users = self.active_users_total,
            winner = self.winner_country,
            meeting = self.getMeetingData(user) if self.meeting_stage else None
        )
            