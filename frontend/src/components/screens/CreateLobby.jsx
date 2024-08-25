import { useMemo, useState } from 'react'
import { useNavigate } from "react-router-dom"
import FormContainer from '../ui/form-container/FormContainer'
import Header from '../ui/header/Header'
import { ApiService } from '../../services/api.service'
import Cookies from 'js-cookie'
import { Notify } from 'notiflix';

export default function CreateLobby() {
    const [data, setData] = useState({
        name: "",
        count: ""
    })

    const nav = useNavigate()
    const api = useMemo(() => new ApiService(nav), [nav])   

    api.checkLogin()

    function Create () {
        api.request("/room", "POST", {
            ownername: data.name,
            maxcount: data.count
        }).then(async response => {
            const json = await response.json()
            if (response.status == 422) Notify.failure("Минимальное количество участников - 2, максимальное - 40")
            else if (response.status != 200) Notify.failure(json.detail)
            else {
                Notify.success("Лобби было создано")
                Cookies.set("token", json.token)
                nav("/lobby")
            }
        })
    }

    return (<>
        <Header />

        <FormContainer>
            <h1>Создание комнаты</h1>
            <input 
                type="text" 
                placeholder="Ваш никнейм" 
                value={data.name} 
                onChange={e => setData(prev => ({...prev, name: e.target.value}))} 
            />
            <input 
                type="number"
                placeholder="Макс кол-во участников" 
                value={data.count} 
                onChange={e => setData(prev => ({...prev, count: e.target.value}))} 
            />
            <button onClick={Create}>Создать</button>
        </FormContainer>
    </>)
}