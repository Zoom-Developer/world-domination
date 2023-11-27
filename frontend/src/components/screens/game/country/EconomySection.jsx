import styles from './Country.module.css'
import PropType from 'prop-types'
import { ApiService } from '../../../../services/api.service'
import { Notify } from 'notiflix'

export default function EconomySection({game, country}) {

    const nf = Intl.NumberFormat()
    const api = new ApiService()

    function upgradeCity(city) {
        api.request("/game/country/cities/" + city, "PATCH", {
            "upgrade_type": "level_upgrade"
        })
        .then(async (response) => {
            const json = await response.json()
            if (response.status != 200) Notify.failure(json.detail)
            else Notify.success("Уровень города повышен")
        })
    }

    return (
        <section className={styles['block-economy']}>
            <div className={styles['cards-economy']}>
                <div className={styles['economy-background']}>
                {
                    Object.entries(country.cities).map(([i, city]) => (
                        <div key={i} className={styles['card-economy']}>
                            <div className={styles['city-header']}>
                                <h3>{city.title}</h3>
                                <h4>Стоимость уровня: <b>{city.level < game.config.MAX_CITY_LEVEL ? (nf.format(game.config.LEVEL_UPGRADE_PRICE + (10 * (city.level - 1))) + "$") : "MAX"}</b></h4>
                            </div>
                            <div className={styles['city-header']}>
                                <ul>
                                    <li>Текущий уровень города: <b>{city.level}</b></li>
                                    <li>Доход за раунд: <b>{city.income}$</b> <b>{city.level < game.config.MAX_CITY_LEVEL && "(+20)"}</b></li>
                                    <li>ПВО: <b>{city.air_defense ? "Есть" : "Нет"}</b></li>
                                </ul>
                            </div>
                            <button onClick={() => upgradeCity(i)}>Улучшить</button>
                        </div>
                    ))
                }
                </div>
            </div>
        </section>
    )
}
EconomySection.propTypes = {
    game: PropType.object,
    country: PropType.object
}