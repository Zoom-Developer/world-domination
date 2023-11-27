import { useEffect, useState } from 'react'
import styles from './Lobby.module.css'
import { useNavigate } from 'react-router-dom';
import config from '../../../assets/js/config';
import { ApiService } from '../../../services/api.service';
import { LongpollService } from '../../../services/longpoll.service';
import { Notify } from 'notiflix';
import ModalWindow from '../../ui/modal-window/ModalWindow';

export default function Lobby() {

	const [room, setRoom] = useState({})
	const [user, setUser] = useState({})

	const [countryVisible, setCountryVisible] = useState(false)
	const [country, setCountry] = useState("ru")

	const [kickUserId, setKickUserId] = useState(1)
	const [kickVisible, setKickVisible] = useState(false)

	const nav = useNavigate()
	const api = new ApiService(nav)
	const [longpoll] = useState(new LongpollService({"setRoom": setRoom, "setUser": setUser, "nav": nav}))

	const unsecuredCopyToClipboard = (text) => { const textArea = document.createElement("textarea"); textArea.value=text; document.body.appendChild(textArea); textArea.focus();textArea.select(); try{document.execCommand('copy')}catch(err){console.error('Unable to copy to clipboard',err)}document.body.removeChild(textArea)};

	useEffect(() => {

		async function getLobby() {
			const response = await api.request("/room", "GET")
			if (response.status != 200) api.resetLogin()
			else {
				const json = await response.json()
				setRoom(json)
				if (json.started) nav("/game")
				else {
					api.request("/room/user", "GET").then(async (response) => {
						setUser(await response.json())
					})
					longpoll.Start()
				}
			}
		}

		getLobby()

		return () => longpoll.Stop()

	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	function confirmCountry() {
		setCountryVisible(false)
		api.request("/room/user/@me", "PATCH", { country: country } )
		.then(async (response) => {
			const json = await response.json()
			if (response.status != 200) Notify.failure(json.detail)
		})
	}

	function kickUser(user) {
		api.request("/room/user/" + user, "DELETE")
		.then(async (response) => {
			const json = await response.json()
			if (response.status != 200) Notify.failure(json.detail)
		})
	}

	function quitGame() {
		api.request("/room/user/@me", "DELETE")
		Notify.success(user.isowner ? "Комната удалена" : "Вы вышли из комнаты")
		api.resetLogin()
	}

	function startGame() {
		api.request("/game/start", "POST")
		.then(async (response) => { 
			const json = await response.json();
			if (response.status != 200) Notify.failure(json.detail)
		})
	}
	
	if (Object.keys(user).length == 0) return (<></>)
	else return (<>
		<div className={styles.container}>
			<span className={styles['top-left']}>Код комнаты: <b>{room.code}</b><span style={{userSelect: "none", cursor: "pointer"}} onClick={() => {unsecuredCopyToClipboard(room.code); Notify.success("Код скопирован")}}>⎘</span></span>
			<span className={styles['top-right']}>Ведущий: <b>{room.owner.name}</b></span>
		</div>

		<div className={styles['center-wrapper']}>
			{user.isowner && <>
				<button onClick={startGame}>Начать игру</button> 
				<button onClick={() => {
					!room.users[kickUserId] && setKickUserId(room.users[0].id)
					setKickVisible(true)
				}}>Исключить игрока</button>
			</>}
			{!user.isowner && <button onClick={() => setCountryVisible(true)}>Выбрать страну</button>}
			<button onClick={quitGame}>Выход</button>
		</div>

		{kickVisible &&
			<ModalWindow button_title="Исключить" button_callback={() => kickUser(kickUserId)} setOpened={setKickVisible}>
				<select value={kickUserId} onChange={e => setKickUserId(e.target.value)}>
					{room.users.map(ply => (
						<option key={ply.id} value={ply.id}>{ply.name}</option>
					))}
				</select>
			</ModalWindow>
		}

		{countryVisible && 
			<ModalWindow button_title="Подтвердить" button_callback={confirmCountry} setOpened={setCountryVisible}>
				<select value={country} onChange={e => setCountry(e.target.value)}>
					{Object.keys(config.Countries).map(c_id => {
						const leader = room.users.find(user => user.country == c_id & user.isleader)
						return (<option key={c_id} value={c_id}>{config.Countries[c_id]} {leader && `(${leader.name})`}</option>)
					})}
				</select>
			</ModalWindow>
		}
		
		<div className={styles.playersinfo}>
			<li className={styles.title}>Игроки: <b className={styles.count}>{`${room.users.length} / ${room.maxcount}`}</b></li>
			<ul>
				{room.users.map(ply => (
					<li key={ply.id}>{ply.name} <b>{config.Countries[ply.country] || ""} {ply.isleader && "(Президент)"}</b></li>
				))}
			</ul>
		</div>
	</>)
}