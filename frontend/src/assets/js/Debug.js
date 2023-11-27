import Cookies from "js-cookie";
import { ApiService } from "../../services/api.service";

const api = new ApiService()

window.debugApi = {
    addMoney(country, value) {
        api.request(`/debug/countries/${country}/money`, "PUT", {value: value})
    },
    startGame(country) {
        api.request(`/debug/start`, "POST", {country: country})
        .then(async response => {
            if (response.status != 200) console.log("Error")
            else {
                Cookies.set("token", (await response.json()).token)
                document.location = "/game"
            }
        })
    },
    nextStage() {
        api.request(`/debug/next`, "POST")
    },
    setStage(stage) {
        api.request(`/debug/stage`, "PATCH", {stage: stage})
    },
}