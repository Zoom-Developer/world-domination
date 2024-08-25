import { Notify } from 'notiflix'
import config from '../../../assets/js/config'
import { ApiService } from '../../../services/api.service'
import FormContainer from '../../ui/form-container/FormContainer'
import styles from './Game.module.css'
import PropType from 'prop-types'

export default function EndGame({winner, isowner}) {

    const api = new ApiService()

    function quitGame() {
		api.request("/room/user/@me", "DELETE")
		Notify.success(isowner ? "Комната удалена" : "Вы вышли из комнаты")
		api.resetLogin()
	}

    return (<>
        <div className={styles['category-header']} style={{marginTop: "10vh"}}>
            <h2>Конец игры</h2>
            <div className={styles.line} />
        </div>

        <div className={styles.endgame}>
            <span>{winner != -1 ? (<>Победа за страной <b>{config.Countries[winner.id]}</b></>) : "Все страны уничтожены"}</span>
        </div>

        <FormContainer>
            <button onClick={quitGame}>{isowner ? "Закончить игру" : "Выход из игры"}</button>
        </FormContainer>

        <LogPanel logs={[].concat(...game.countries.map(c => c.logs.map(l => Object.assign(l, {country: c.id}))))} for_owner={true} />
    </>)
}
EndGame.propTypes = {
    winner: PropType.object,
    isowner: PropType.bool
}