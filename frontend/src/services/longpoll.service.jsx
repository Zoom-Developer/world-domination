import { Notify } from "notiflix";
import config from "../assets/js/config";
import { ApiService } from "./api.service";

export class LongpollService {

    constructor({isOwner, setRoom, setUser, setGame, setCountry, updateGameInfo, country, nav}) {
        this.isOwner = isOwner
        this.setRoom = setRoom
        this.setUser = setUser
        this.setGame = setGame
        this.setCountryF = setCountry
        this.updateGameInfo = updateGameInfo
        this.nav = nav
        this.country = country

        this.api = new ApiService(nav)
        this.eventId = 0
        this.interval = 0
    }

    Start() {
        this.api.request("/room/events", "GET")
        .then( async (response) => {
            this.eventId = Number(await response.text()) + 1
            this.interval = setInterval(this.longpollRequest.bind(this), 1000)
        })
    }

    Stop() {
        clearInterval(this.interval)
    }

    longpollRequest() {
        this.api.request("/room/events/" + this.eventId, "GET")
        .then( async (response) => {
            if (response.status != 200) {
                this.Stop()
                this.api.resetLogin()
            }
            else {
                const eventList = await response.json()
                eventList.forEach(event => {
                    this.eventId = Number(event.id) + 1
                    this.longpollHandler(event)
                });
            }
        });
    }

    setCountry(country) {
        this.setGame(game => {
            const idx = game.countries.findIndex(c => c.id == country.id)
            game.countries[idx] = (typeof(country) == "function") ? country(game.countries[idx]) : country
            return {...game}
        })
        if (!this.isOwner) this.setCountryF(country)
    }

    longpollHandler(event) {
        const EventType = config.EventType
        switch (event.type) {
            case EventType.USER_JOINED:
                this.setRoom(prev => {
                    prev.users.push(event.data)
                    return {...prev}
                })
                Notify.info(`Игрок ${event.data.name} вошёл в комнату`)
                break
    
            case EventType.USER_UPDATED:
                if ( !Array.isArray(event.data) ) event.data = [event.data]
                event.data.forEach(user => {
                    this.setRoom(prev => {
                        var index = prev.users.findIndex((ply) => ply.id == user.id);
                        prev.users[index] = user
                        return {...prev}
                    })
                    Notify.info(
                        user.isleader ? `Игрок ${user.name} стал президентом страны ${config.Countries[user.country]}`
                        : `Игрок ${user.name} выбрал страну ${config.Countries[user.country]}`
                    )
                })
                break
    
            case EventType.USER_QUITED:
                this.setRoom(prev => {
                    var index = prev.users.findIndex((ply) => ply.id == event.data.id);
                    delete prev.users.splice(index, 1)
                    return {...prev}
                })
                Notify.info(`Игрок ${event.data.name} покинул комнату`)
                break
    
            case EventType.GAME_STARTED:
                Notify.success("Игра запущена")
                this.nav("/game")
                break

            case EventType.GAME_ROUND_CHANGED:
                this.updateGameInfo()
                Notify.info(event.data ? "Начался этап обсуждения" : "Начался новый раунд")
                break

            case EventType.COUNTRY_UPGRADE:
                this.setCountry(event.data)
                break

            case EventType.SEND_SANCTION:
                if (event.data.receiver == this.country.id) {
                    Notify.warning(`Страна ${config.Countries[event.data.sender]} наложила на вас санкции`)
                }
                else Notify.info(`Вы наложили санкции на страну ${config.Countries[event.data.receiver]}`)
                break

            case EventType.USER_READY:
                this.setGame(prev => ({...prev, ready_users: event.data}))
                break

            case EventType.NUCLEAR_ATTACK:
                if (!this.isOwner) Notify.info(`Вы запустили боеголовку на город ${event.data.attacked.title} (${config.Countries[event.data.attacked.country]})`)
                this.setCountry(event.data.attacker)
                break

            case EventType.DONATE_ECOLOGY:
                if (!this.isOwner) Notify.info(`Вы внесли вклад в экономику`)
                this.setCountry(event.data)
                break

            case EventType.COUNTRY_TRANSFER: {
                let nf = Intl.NumberFormat()
                if (event.data.sender.id == this.country.id) {
                    Notify.success(`Вы перевели ${nf.format(event.data.value)}$ стране ${config.Countries[event.data.receiver]}`)
                }
                else {
                    Notify.success(`Страна ${config.Countries[event.data.sender]} перевела вам ${nf.format(event.data.value)}$`)
                }
                break
            }

            case EventType.GAME_ENDED:
                Notify.info("Игра окончена")
                this.updateGameInfo()
                break

            case EventType.COUNTRY_CALL_OWNER:
                this.setCountry(event.data)
                if (this.isOwner) {
                    const sound = new Audio("/call.mp3")
                    sound.play()
                }
                break
        }
    }
}