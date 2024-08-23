import PropType from 'prop-types'
import FormContainer from '../../../ui/form-container/FormContainer'
import ModalWindow from '../../../ui/modal-window/ModalWindow'
import game_styles from '../Game.module.css'
import config from '../../../../assets/js/config'
import LogPanel from '../log-panel/LogPanel'
import { ApiService } from '../../../../services/api.service'
import { Notify } from 'notiflix'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

// eslint-disable-next-line no-unused-vars
export default function OwnerPanel({country, game, user}) {

    const api = new ApiService({nav: useNavigate()})
    const [countryMoney, setCountryMoney] = useState(null)
    const [countryMoneyValue, setCountryMoneyValue] = useState(0)
    const [sendMoneyVisible, setSendMoneyVisible] = useState(false)

    function startNextRound() {
        api.request("/game/next", "POST")
        .then(async (response) => {
            const json = await response.json()
            if (response.status != 200) Notify.failure(json.detail)
        })
    }

    function stopGame() {
        api.request("/room/user/@me", "DELETE")
        .then(async (response) => {
            const json = await response.json()
            if (response.status != 200) Notify.failure(json.detail)
            else Notify.success("Игра была преждевременно закончена")
        })
    }

    function sendMoney(country, value) {
        api.request(`/game/country/${country}/money`, "POST", {value})
        .then(async (response) => {
            const json = await response.json()
            if (response.status != 200) Notify.failure(json.detail)
            else Notify.success("Средства были переведены")
        })
    }

    return (<>
        <div className={game_styles['category-header']} style={{marginTop: "10vh"}}>
            <h2>Панель ведущего</h2>
            <div className={game_styles.line}></div>
        </div>

        <FormContainer>
            <button onClick={startNextRound}>Следующий раунд</button>
            <button onClick={() => {
                setCountryMoney(game.countries[0].id)
                setSendMoneyVisible(true)
            }}>Отправить деньги</button>
            <button onClick={stopGame}>Закончить игру</button>
        </FormContainer>

        <LogPanel logs={[].concat(...game.countries.map(c => c.logs.map(l => Object.assign(l, {country: c.id}))))} for_owner={true} />

        {sendMoneyVisible &&
			<ModalWindow button_title="Отправить" button_callback={() => sendMoney(countryMoney, countryMoneyValue)} setOpened={setSendMoneyVisible}>
				<select value={countryMoney} onChange={e => setCountryMoney(e.target.value)}>
					{
                        game.countries.map(ct => (
                            <option key={ct.id} value={ct.id}>{config.Countries[ct.id]}</option>
                        ))
                    }
				</select>
                <input type="number" value={countryMoneyValue} placeholder='Сумма' onChange={e => setCountryMoneyValue(e.target.value)} />
			</ModalWindow>
		}
    </>)
    
}
OwnerPanel.propTypes = {
    country: PropType.object,
    game: PropType.object,
    user: PropType.object
}