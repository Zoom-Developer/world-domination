import styles from './Header.module.css'
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
    const location = useLocation()
    return (
        <div className={styles.topnav}>
            <Link className={location.pathname == "/" ? styles.active : ""} to="/">Главная</Link>
            <Link className={location.pathname == "/create" ? styles.active : ""} to="/create">Создание лобби</Link>
            <Link className={location.pathname == "/login" ? styles.active : ""} to="/login">Вход в лобби</Link>
        </div>
    )
}