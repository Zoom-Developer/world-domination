import Header from '../../ui/header/Header'
import styles from './Home.module.css'

export default function Home() {
    return (
        <>
        <Header />

        <h1 className={styles.welcome}>Добро пожаловать на страницу игры<br />Мировое Господство</h1>
        

        <div className={styles.desc}>
            <h2>Это сочетание классической мафии и пошаговой стратегии, в котором для победы необходимо
                любыми средствами вывести свою страну на вершину мира по уровню жизни. Способов для этого 2: ядерное
                оружие и развитие экономики.В игре разрешены использовать любые психологические приёмы в 
                рамках разумного. Всего Вас ожидает 6 раундов, каждый из которых состоит из 2 частей: обсуждения и дебаты. На этапе дебатов участникам игры необходимо собраться в любой удобной голосовой конференции (Discord, Teamspeak и др.)
            </h2>
        </div>


        <div className={styles.contacts}>
            <h2>Backend/Frontend(JSX) Developer: <a target='blank' href='https://vk.com/id380487228'><b>Александр Замараев</b></a></h2>
            <h2>UI/UX Designer, Frontend developer: <a target='blank' href='https://vk.com/id201887526'><b>Рамир Воробьёв</b></a></h2>
        </div>
        </>
    )
}