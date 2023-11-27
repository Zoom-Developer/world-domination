import styles from './log-panel.module.css'
import PropType from 'prop-types'
import ReactHtmlParser from 'react-html-parser'
import config from '../../../../assets/js/config'

export default function LogPanel({logs}) {
    return (
        <div className={styles['log-panel']}>
            <ul>
                {
                    logs.map(log => {
                        const formattedText = log.text.replace(/(\w+)/g, match => config.Countries[match] || match)
                        return (<li key={logs.indexOf(log)}>
                            <b className={styles.time}>{new Date(log.time + "Z").toLocaleTimeString()}</b>
                            {ReactHtmlParser(formattedText)}
                        </li>)
                    })
                }
            </ul>
        </div>
    )
}
LogPanel.propTypes = {
    logs: PropType.array
}