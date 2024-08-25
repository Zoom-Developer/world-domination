import styles from './Country.module.css'
import config from '../../../../assets/js/config'
import PropType from 'prop-types'
import { ApiService } from '../../../../services/api.service'
import { Notify } from 'notiflix'
import ModalWindow from '../../../ui/modal-window/ModalWindow'
import { useState } from 'react'

export default function ArmySection({game, country}) {

    const nf = Intl.NumberFormat()
    const api = new ApiService()

    const [DefenseVisible, setDefenseVisible] = useState(false)
    const [selectedCity, setSelectedCity] = useState(Object.values(country.cities)[0].id)

    function buyAirDefense(city) {
        api.request(`/game/country/cities/${city}`, "PATCH", {
            upgrade_type: "air_defense"
        })
        .then(async (response) => {
            const json = await response.json()
            if (response.status != 200) Notify.failure(json.detail)
            else Notify.success("ПВО куплено")
        })
    }

    function UpgradeCountry(type) {
        api.request("/game/country", "PATCH", {
            upgrade_type: type
        })
        .then(async (response) => {
            const json = await response.json()
            if (response.status != 200) Notify.failure(json.detail)
            else Notify.success("Улучшение куплено")
        })
    }

    return (
        <section className={styles['block-army']}>

            <div className={styles['army-cards']}>
                {
                    config.CountryUpgrades.map(upgrade => {
                        const bought = upgrade.id == "nuclear_reactor" & (country.nuclear_reactor || country.nuclear_reactor_creating)
                        return <div key={upgrade.id} className={styles['army-card']}>
                            <div className={styles.price}>
                                <h2>Стоимость: <b>{nf.format(game.config[upgrade.price_type])}$</b></h2>
                            </div>
                            <div className={styles.content}>
                                <div className={styles.title}>{upgrade.title + (upgrade.id == "nuclear_rocket" ? ` (${country.nuclear_rockets}/10)` : "")}</div>
                                <div className={styles.icon}><img src={upgrade.img} /></div>
                                <p className={styles.description}>{upgrade.desc}</p>
                            </div>
                            <button onClick={
                                upgrade.id != "shield" 
                                ? () => UpgradeCountry(upgrade.id) 
                                : () => setDefenseVisible(true)
                            } disabled={bought}>{bought ? (country.nuclear_reactor ? "Приобретено" : "Строительство") : "Приобрести"}</button>
                        </div>
                    })
                }
            </div>

            {DefenseVisible &&
                <ModalWindow button_title="Приобрести" button_callback={() => buyAirDefense(selectedCity)} setOpened={setDefenseVisible}>
                    <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
                        {
                            Object.entries(country.cities).map(([i, city]) => (
                                <option key={i} value={i}>{city.title}</option>
                            ))
                        }
                    </select>
                </ModalWindow>
            }
        </section>
    )
}
ArmySection.propTypes = {
    game: PropType.object,
    country: PropType.object,
    user: PropType.object
}