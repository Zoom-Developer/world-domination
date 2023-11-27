import { useMemo, useState } from 'react'
import { useNavigate } from "react-router-dom"
import Header from '../ui/header/Header'
import FormContainer from '../ui/form-container/FormContainer'
import { ApiService } from '../../services/api.service'
import Cookies from 'js-cookie'
import { Notify } from 'notiflix'

export default function LoginLobby() {
    const [data, setData] = useState({
        name: "",
        code: ""
    })

    const nav = useNavigate()
    const api = useMemo(() => new ApiService(nav), [nav])

    api.checkLogin()

    function Login () {
        api.request("/room/" + encodeURIComponent(data.code), "POST", {
            name: data.name
        }).then(async response => {
            const json = await response.json()
            if (response.status != 200) Notify.failure(json.detail)
            else {
                Notify.success("Вы подключились к лобби")
                Cookies.set("token", json.token)
                nav("/lobby")
            }
        })
    }

    return (<>
        <Header />

        <FormContainer>
            <h1>Вход в комнату</h1>
            <input 
                type="text" 
                placeholder="Код комнаты" 
                value={data.code}
                onChange={e => setData(prev => ({...prev, code: e.target.value}))}
            />
            <input 
                type="text" 
                placeholder="Ваш никнейм" 
                value={data.name}
                onChange={e => setData(prev => ({...prev, name: e.target.value}))}
            />
            <button onClick={Login}>Войти</button>
        </FormContainer>
    </>)
}