import PropType from 'prop-types'
import styles from './ModalWindow.module.css'

export default function ModalWindow({children, button_title, button_callback, setOpened}) {

    function onFinish() {
        button_callback && button_callback()
        setOpened && setOpened(false)
    }

    return (
        <div className={styles.dialog}>
            {children}
            <button onClick={onFinish}>{button_title}</button>
            <button onClick={() => setOpened(false)}>Закрыть</button>
        </div>
    )

}
ModalWindow.propTypes = {
    children: PropType.oneOfType([
        PropType.arrayOf(PropType.node),
        PropType.node
    ]).isRequired,
    button_title: PropType.string,
    button_callback: PropType.func,
    setOpened: PropType.func
}