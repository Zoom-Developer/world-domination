import PropType from 'prop-types'
import game_styles from '../Game.module.css'
import styles from './Meeting.module.css'
import FormContainer from '../../../ui/form-container/FormContainer'
import { ApiService } from '../../../../services/api.service'
import { Notify } from 'notiflix'
import config from '../../../../assets/js/config'
import ReactHtmlParser from 'react-html-parser'

// eslint-disable-next-line no-unused-vars
export default function MeetingPage({game, country, user}) {

    const api = new ApiService()

    function continueStage() {
        api.request("/game/next", "POST")
        .then(async (response) => {
            const json = await response.json()
            if (response.status != 200) Notify.failure(json.detail)
        })
    }

    return (<>
        <div className={game_styles['category-header']} style={{marginTop: "10vh"}}>
            <h2>Обсуждение раунда <b>№{game.stage}</b></h2>
            <div className={game_styles.line}></div>
        </div>

        <div className={styles.content}>
            <div className={styles["round-end-info"]}>
                <div>
                    <h3>Уничтоженные города:</h3>
                    <h4>
                        {game.meeting.destroyed_cities.map(data => (
                            <b key={data.id}>{`${data.title} (${config.Countries[data.country]}), `}</b>
                        ))}
                    </h4>
                </div>
                <div>
                    <h3>Уничтоженные страны:</h3>
                    <h4>
                        {game.meeting.destroyed_countries.map(data => (
                            <b key={data.id}>{`${config.Countries[data.id]}, `}</b>
                        ))}
                    </h4>
                </div>
                <div>
                    <h3>Санкции:</h3>
                    <div className={styles.sanctions}>
                        {game.meeting.sanctions.map(data => (
                            <span key={data.id}>{ReactHtmlParser(`<b>${config.Countries[data.sender.id]}</b> наложил санкции на <b>${config.Countries[data.receiver.id]}.</b>`)}</span>
                        ))}
                    </div>
                </div>
                <div>
                    <h3>Вклады в экологию:</h3>
                    <h4>
                        {game.meeting.ecology_donates.reduce((acc, obj) => acc.find(item => item.id === obj.id) ? acc : [...acc, obj], []).map(data => (
                            <b key={data.id}>{`${config.Countries[data.id]} (+${game.meeting.ecology_donates.filter(c => c.id == data.id).length * 20}%)`}, </b>
                        ))}
                    </h4>
                </div>
            </div>
            <div className={styles.countries}>
                <h3>Соотношение стран</h3>
                <br/>
                {Object.keys(game.meeting.countries_progress).map(country => (
                    <span key={country}>{config.Countries[country]} <b>({Math.round(game.meeting.countries_progress[country]*100)}%)</b></span>
                ))}
            </div>
        </div>

        {user.isowner && <FormContainer>
            <button onClick={continueStage}>Продолжить игру</button>
        </FormContainer>}
    

        {
            (!country && !user.isowner) &&
            <div className={game_styles['game-stats']}>
                <h2>Ваша страна уничтожена</h2>
            </div>
        }
    </>)

}
MeetingPage.propTypes = {
    game: PropType.object,
    country: PropType.object,
    user: PropType.object
}