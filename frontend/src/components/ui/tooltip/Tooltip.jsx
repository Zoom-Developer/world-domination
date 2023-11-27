import styles from './Tooltip.module.css'
import PropType from 'prop-types'

export default function ImageTooltip({img, children}) {
    return (
        <div className={styles.tooltip}>
            {img}
            <span className={styles.tooltiptext}>
                {children}
            </span>
        </div>
    )
}
ImageTooltip.propTypes = {
    img: PropType.node.isRequired,
    children: PropType.oneOfType([
        PropType.arrayOf(PropType.node),
        PropType.node
    ]).isRequired
}