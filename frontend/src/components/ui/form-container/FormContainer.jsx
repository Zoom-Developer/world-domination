import styles from './FormContainer.module.css'
import PropType from 'prop-types'

export default function FormContainer({ children }) {
    return <div className={styles.container}>{children}</div>
}
FormContainer.propTypes = {
    children: PropType.oneOfType([
        PropType.arrayOf(PropType.node),
        PropType.node
    ]).isRequired,
}