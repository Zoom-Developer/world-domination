const config = {
    API_URL: import.meta.env.VITE_API_URL,

    // ENUMS

    Countries: {
        ru: "Россия",
        cn: "Китай",
        sp: "Испания",
        de: "Германия",
        us: "США",
        fr: "Франция",
        lt: "Италия",
        rk: "КНДР",
        jp: "Япония",
        by: "Беларусь",
        pa: "Палестина",
        pr: "Португалия",
        ng: "Нигерия"
    },

    EventType: {
        // USER TYPES
        USER_JOINED: "newuser",
        USER_UPDATED: "updateuser",
        USER_QUITED: "quituser",
        USER_READY: "readyuser",
    
        // GAME TYPES
        GAME_STARTED: "startgame",
        GAME_ENDED: "endgame",
        GAME_ROUND_CHANGED: "nextround",
    
        // COUNTRY TYPES
        COUNTRY_UPGRADE: "upgradecountry",
        COUNTRY_TRANSFER: "transfermoney",
        SEND_SANCTION: "sendsanction",
        NUCLEAR_ATTACK: "nuclearattack",
        DONATE_ECOLOGY: "ecologydonate"
    },

    // ITEMS

    CountryUpgrades: [
        {
            "id": "nuclear_reactor",
            "title": "Ядерный реактор",
            "img": "/nuclear-plant.png",
            "desc": "Дает возможность вашему государству производить ядерные ракеты",
            "price_type": "NUCLEAR_REACTOR_PRICE"
        },
        {
            "id": "nuclear_rocket",
            "title": "Ядерная боеголовка",
            "img": "/missile.png",
            "desc": "Позволяет наносить удар по городам других государств",
            "price_type": "NUCLEAR_ROCKET_PRICE"
        },
        {
            "id": "shield",
            "title": "Система ПВО",
            "img": "/shield.png",
            "desc": "Даёт неуязвимость от атаки по выбранному городу",
            "price_type": "AIR_DEFENSE_PRICE"
        }
    ]
}

export default config