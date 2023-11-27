import PropType from 'prop-types'
import FormContainer from '../../../ui/form-container/FormContainer'
import game_styles from '../Game.module.css'
import { ApiService } from '../../../../services/api.service'
import { Notify } from 'notiflix'
import { useNavigate } from 'react-router-dom'

// eslint-disable-next-line no-unused-vars
export default function OwnerPanel({country, game, user}) {

    const api = new ApiService({nav: useNavigate()})

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

    return (<>
        <div className={game_styles['category-header']} style={{marginTop: "10vh"}}>
            <h2>Панель ведущего</h2>
            <div className={game_styles.line}></div>
        </div>

        <FormContainer>
            <button onClick={startNextRound}>Следующий раунд</button>
            <button onClick={stopGame}>Закончить игру</button>
        </FormContainer>
    </>)
    
}
OwnerPanel.propTypes = {
    country: PropType.object,
    game: PropType.object,
    user: PropType.object
}