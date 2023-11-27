import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './screens/home/Home'
import CreateLobby from './screens/CreateLobby'
import Lobby from './screens/lobby/Lobby'
import LoginLobby from './screens/Login'
import Game from './screens/game/Game'

export default function Router() {
    return <BrowserRouter>
    <Routes>
        <Route element={<Home />} path='/' />
        <Route element={<CreateLobby />} path='/create' />
        <Route element={<LoginLobby />} path='/login' />
        <Route element={<Lobby />} path='/lobby' />
        <Route element={<Game />} path="/game" />

        <Route path='*' element={<><h2>Not Found</h2></>} />
    </Routes>
    </BrowserRouter>
}