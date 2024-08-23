import { useEffect, useState } from "react";
import CountryPanel from "./country/CountryPanel";
import { ApiService } from "../../../services/api.service";
import { useNavigate } from "react-router-dom";
import { LongpollService } from "../../../services/longpoll.service";
import OwnerPanel from "./owner/Owner";
import MeetingPage from "./meeting/Meeting";
import { formatTime } from "../../../assets/js/utils";
import styles from './Game.module.css';
import config from "../../../assets/js/config";
import EndGame from "./EndGame";

export default function Game() {

    const [game, setGame] = useState({})
    const [user, setUser] = useState({})
    const [country, setCountry] = useState({})
    const [roundTimer, setRoundTimer] = useState(0)

    async function getGame(startlong) {
        const response = await api.request("/game", "GET")
        const jsonGame = await response.json()
        if (response.status != 200) nav("/lobby")
        else {
            setGame(jsonGame)
            const response = await api.request("/room/user", "GET")
            const jsonUser = await response.json()
            setUser(jsonUser)
            const country_ = jsonGame.countries.find(country => country.id == jsonUser.country)
            longpoll.isOwner = jsonUser.isowner
            setCountry(country_)
            if (startlong) {
                longpoll.country = country_
                longpoll.Start()
            }
        }
    }

    const nf = Intl.NumberFormat()
    const nav = useNavigate()
    const api = new ApiService(nav)
    const [longpoll] = useState(new LongpollService({"setGame": setGame, "setCountry": setCountry, "nav": nav, "updateGameInfo": getGame, "isOwner": user.isowner}))

    useEffect(() => {

        getGame(true)

        return () => longpoll.Stop()

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const interval = setInterval(() => setRoundTimer(formatTime(Math.max((new Date(game.stage_end + "Z") - new Date()) / 1000, 0))))

        return () => clearInterval(interval)
    }, [game])

    if (Object.keys(user).length == 0) return (<></>)
    else return (<>

        {!game.winner && <>
            {!game.meeting && 
                <div className={styles['round-timer']}>
                    <span>{`${roundTimer} (${game.ready_users} / ${game.total_users})`}</span>
                </div>
            }

            {
                (country || user.isowner) && <>
                    <div className={styles['game-stats']}>
                        <h4>Статус игры: <b>{game.meeting ? `обсуждение ${game.stage} раунда` : `${game.stage} раунд`}</b></h4>
                        {!user.isowner && <h4>Вы играете за страну: <b>{config.Countries[country.id]}</b></h4>}
                    </div>
                    
                    <div className={styles['game-info']}>
                        <h4>Экология: <b>{game.ecology}%</b></h4>
                        {!user.isowner && <>
                            <h4>Баланс: <b>{nf.format(country.balance)}$</b></h4></>
                            /* <h4>Развитие экономики: <b>{country.economy_progress}%</b></h4>*/
                        }
                    </div></>
            }
        </>}

        {game.winner
            ? <EndGame winner={game.winner} isowner={user.isowner} />
            : game.meeting 
                ? <MeetingPage game={game} country={country} user={user} />
                : !user.isowner
                    ? country
                        ? <CountryPanel country={country} user={user} game={game} setUser={setUser} />
                        : <>
                            <h1 style={{marginTop: "40vh", textAlign: "center"}}>Ваша страна уничтожена</h1>
                            <h2>Вам всё ещё доступна страница обсуждений</h2>
                        </>
                    : <OwnerPanel country={country} user={user} game={game} />
        }
    </>)
}