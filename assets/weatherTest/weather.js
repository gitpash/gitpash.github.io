const URL = "https://api.darksky.net/forecast/"
const key = "a23ab48212bfa00e8fc4261a12f0fb18/"
const button = document.getElementById('btn')

//use var !only for no Safari issue!
var review = document.getElementById('review')
var tempr = document.getElementById('tempr')
var point = document.getElementById('point')
var timezome = document.getElementById('timezone')
var units = 'si'
var ppp = document.getElementById('ppp')

navigator.geolocation.getCurrentPosition((position) => {

    fetch(
            `${URL}${key}${position.coords.latitude},${position.coords.longitude}?units=${units}`)
        .then(response => response.json())
        .then(fetchData => {
            showWeather(fetchData)
        })
        .catch(function(reason) {
            console.log(reason)
        })
})

showWeather = fetchData => {

    review.innerHTML = fetchData.daily.summary
    timezone.innerHTML = fetchData.timezone
    currentT = Math.round(fetchData.currently.temperature)
    tempr.innerHTML =  `${currentT}℃`
    icon = (fetchData.currently.icon).toUpperCase().replace(/-/g,'_')
    //icon = fetchData.currently.icon
    

button.addEventListener("click", () => {
    if (units === 'si') {
        tempr.innerHTML = `${currentT * 1.8 + 32}°F`
        units = 'us'
}
    else {
        tempr.innerHTML = `${currentT}℃`
        units = 'si'
}
 })

 const skycons = new Skycons({"color": "pink"})
 skycons.add(document.getElementById("icon"), Skycons[icon])
 skycons.play()
 }