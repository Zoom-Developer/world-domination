import styles from './log-panel.module.css'
import PropType from 'prop-types'
import ReactHtmlParser from 'react-html-parser'
import config from '../../../../assets/js/config'

export default function LogPanel({logs, for_owner}) {
    return (
        <div className={styles['log-panel']} style={(for_owner) ? {width: "450px"} : {}} >
            <ul>
                {
                    logs.sort((x, y) => new Date(x.time + "Z") - new Date(y.time + "Z")).map(log => {
                        const formattedText = log.text.replace(/(\w+)/g, match => config.Countries[match] || match)
                        return (<li key={logs.indexOf(log)}>
                            <b className={styles.time}>{new Date(log.time + "Z").toLocaleTimeString()}</b>
                            {for_owner && <b className={styles.country}>{config.Countries[log.country]}</b>}
                            {ReactHtmlParser(formattedText)}
                        </li>)
                    })
                }
            </ul>
        </div>
    )
}
LogPanel.propTypes = {
    logs: PropType.array,
    for_owner: PropType.oneOfType([
        PropType.bool,
        PropType.any
    ])
}