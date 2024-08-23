export function formatTime(time) {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function getCityMaxLevel(game, city) {
    return (city.capital) ? game.config.MAX_CITY_LEVEL + 1 : game.config.MAX_CITY_LEVEL
}