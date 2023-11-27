import styles from './Country.module.css'
import game_styles from '../Game.module.css'
import PropType from 'prop-types'
import ArmySection from './ArmySection'
import EconomySection from './EconomySection'
import ModalWindow from '../../../ui/modal-window/ModalWindow'
import { useState } from 'react'
import ImageTooltip from '../../../ui/tooltip/Tooltip'
import config from '../../../../assets/js/config'
import { ApiService } from '../../../../services/api.service'
import { Notify } from 'notiflix'
import LogPanel from '../log-panel/LogPanel'

export default function CountryPanel({country, game, user, setUser}) {

    const [selectedPage, setSelectedPage] = useState("army")

    const [selectedCountry, setSelectedCountry] = useState(game.countries[0].id)
    const [selectedCity, setSelectedCity] = useState(game.countries[0].cities[0].id)
    const [transferValue, setTransferValue] = useState("")

    const [visibleSanctions, setVisibleSanctions] = useState(false)
    const [visibleNuclear, setVisibleNuclear] = useState(false)
    const [visibleTransfer, setVisibleTransfer] = useState(false)

    const countrySelect = (style) => (<select style={style} value={selectedCountry} onChange={e => {
            setSelectedCountry(e.target.value)
            setSelectedCity(game.countries.find(c => c.id == e.target.value).cities[0].id)
        }}>
        {   
            game.countries.map(ct => (
                <option key={ct.id} value={ct.id}>{config.Countries[ct.id]}</option>
            ))
        }
    </select>)

    const countryCallback = async (response) => {
        const json = await response.json()
        game.countries[0] && setSelectedCountry(game.countries[0].id)
        if (response.status != 200) Notify.failure(json.detail)
    }

    const nf = Intl.NumberFormat()
    const api = new ApiService()

    function sendSanction(country) {
        api.request(`/game/country/${country}/sanctions`, "POST").then(countryCallback)
    }

    function transferMoney(country, value) {
        api.request(`/game/country/${country}`, "PUT", {value: Number(value)}).then(countryCallback)
    }

    function nuclearAttack(country, city) {
        api.request(`/game/country/${country}/cities/${city}/nuclear`, "POST").then(countryCallback)
    }

    function donateEcology() {
        api.request("/game/ecology", "POST")
        .then(async response => {
            const json = await response.json()
            if (response.status != 200) Notify.failure(json.detail)
        })
    }
    
    function setReady(ready) {
        api.request("/room/user/@me", "PATCH", {ready: ready})
        .then(async response => {
            const json = await response.json()
            if (response.status != 200) Notify.failure(json.detail)
            else {
                setUser(prev => ({...prev, ready: !prev.ready}))
            }
        })
    }

    return (<>
        <div className={styles['round-start']}>
            <h2 style={{display: "inline"}}>Доход за раунд: <b>+ {nf.format(country.income)} $</b></h2>
            {(game.ecology != 100 | country.sanctions) ?
                <ImageTooltip img={<img style={{width: 20, height: 20, marginLeft: "10px"}} src="/stat.png" />}>
                    {game.ecology != 100 &&
                        <><span style={{color: game.ecology < 100 ? "red" : "green"}}>{game.ecology < 100 ? "-" : "+"}{Math.abs(100 - game.ecology)}% <b>(Экология)</b></span><br /></>
                    }
                    {
                        country.sanctions.map(sanction_country => (
                            <div key={sanction_country}><span style={{color: "red"}}>-10% <b>(Санкция {config.Countries[sanction_country]})</b></span></div>
                        ))
                    }
                </ImageTooltip> : ""
            }
            <div className={styles['city-per-round']}>
                <ul className={styles.table + " " + styles.city}>
                    {
                        Object.entries(country.cities).map(([i, city]) => (
                            <li key={i}>{city.title} - <b>{nf.format(city.income)}$</b></li>
                        ))
                    }
                </ul>
            </div>
        </div>

        <LogPanel logs={country.logs} />

        <div className={styles["active-buttons"]}>

            <button onClick={() => setVisibleSanctions(true)}>Санкции</button>
            <button onClick={() => setVisibleTransfer(true)}>Перевод</button>
            <br />
            <button onClick={donateEcology}>Вклад в экологию<br />{`(${game.config.DONATE_ECOLOGY + (game.config.DONATE_ECOLOGY * 0.3 * country.ecology_total)}$)`}</button>
            <button onClick={() => setReady(!user.ready)}>{user.ready ? "Отменить готовность" : "Готов"}</button>
            <button onClick={() => setVisibleNuclear(true)}>Запуск боеголовки</button>

        </div>

        {visibleSanctions && 
            <ModalWindow button_title={`Наложить санкцию (${game.config.SEND_SANCTION}$)`} button_callback={() => sendSanction(selectedCountry)} setOpened={setVisibleSanctions}>
                {countrySelect({})}
            </ModalWindow>
        }
        {visibleTransfer && 
            <ModalWindow button_title={"Совершить перевод"} button_callback={() => transferMoney(selectedCountry, transferValue)} setOpened={setVisibleTransfer}>
                {countrySelect({marginBottom: 10})}
                <input type="number" value={transferValue} placeholder='Сумма для перевода' onChange={e => setTransferValue(e.target.value)} style={{marginBottom: 100}} />
            </ModalWindow>
        }
        {visibleNuclear && 
            <ModalWindow button_title="Запустить боеголовку" button_callback={() => nuclearAttack(selectedCountry, selectedCity)} setOpened={setVisibleNuclear}>
                <div>
                    {countrySelect({marginBottom: 0})}
                    <select style={{marginTop: 10}} value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                        {
                            Object.entries(game.countries.find(c => c.id == selectedCountry).cities).map(([i, city]) => (
                                <option key={i} value={i}>{city.title}</option>
                            ))
                        }
                    </select>
                </div>
            </ModalWindow>
        }

        <div className={styles.page}>
            <h1 style={{textAlign: "center"}}>Меню улучшений страны</h1>

            <div className={game_styles['category-header']}>
                <span style={{"--scale": selectedPage == "army" ? 1 : -1}} onClick={() => setSelectedPage(selectedPage == "army" ? "country" : "army")}>{selectedPage == "army" ? "Армия" : "Экономика"}</span>
                <div className={game_styles.line}></div>
            </div>

            {
                selectedPage == "army"
                    ? <ArmySection game={game} country={country} />
                    : <EconomySection game={game} country={country} />
            }
        </div>

    </>)
}
CountryPanel.propTypes = {
    country: PropType.object,
    game: PropType.object,
    user: PropType.object,
    setUser: PropType.func
}