import Cookies from 'js-cookie'
import config from '../assets/js/config'

export class ApiService {

    constructor(nav) {
        this.nav = nav
    }

    request(endpoint, method, body) {
        body = body ? JSON.stringify(body) : null;
        return fetch(config.API_URL + endpoint, {
            method: method,
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
                "token": Cookies.get("token")
            },
            body: body
        })
    }

    resetLogin() {
        Cookies.remove("token")
        this.nav("/")
    }

    checkLogin() {
        if (Cookies.get("token")) {
            this.request("/room/user", "GET")
            .then(async (response) => {
                if (response.status != 200) {
                    Cookies.remove("token")
                    this.nav(window.location.pathname)
                }
                else this.nav("/lobby")
            })
        }
    }
}