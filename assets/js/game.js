const canvas = document.getElementById('gameCanvas')// связываем id canas и  const canvas
const ctx = canvas.getContext('2d') // для рисования канвасом исп ctx

// ctx.beginPath()
// ctx.rect(20, 40, 50, 50) //первые две это координаты вехнего левого угла, а вторые две это ширина и высота
// ctx.fillStyle = "#FF0000" // цвет для метода заливки каваса fill
// ctx.fill() //  вызов метода заливки
// ctx.closePath()
//
// ctx.beginPath()
// ctx.arc(240, 160, 20, 0, Math.PI*2, false) //1 и 2 - координаты центра, 3я-радиус, 4и5 начальный/конечный угол отрислвки
//                                           // в радианах, направление отрисовки(false по часовой и true против) опционально
// ctx.fillStyle = "green"
// ctx.fill()
// ctx.closePath
//
// ctx.beginPath()
// ctx.rect(160, 10, 100, 40)
// ctx.strokeStyle = "rgba(0, 0, 255, 0.5)" // 0.5 это полупрозрачный
// ctx.stroke() // метод stroke рисует контур фигуры
// ctx.closePath()
let x = canvas.width / 2
let y = canvas.height - 30
let dx = 3
let dy = -3
const ballRadius = 10
let paddleHeight = 10
let paddleWidth = 75
let paddleX = (canvas.width-paddleWidth)/2
let rightPressed = false
let leftPressed = false
let brickRowCount = 3
let brickColumnCount = 6
let brickWidth = 75
let brickHeight = 20
let brickPadding = 10
let brickOffsetTop = 30
let brickOffsetLeft = 50
let score = 0
let lives = 3

// случайный цвет
// let randomColor
// function getRandomColor() {
//   let max = 254
//   red = Math.floor(Math.random() * max)
//   green = Math.floor(Math.random() * max)
//   blue = Math.floor(Math.random() * max)
//   randomColor = "rgb(" + red + ", " + green + ", " + blue + ")"
//   return randomColor
// }
// //console.log(randomColor);


let bricks = [] // двумерный массив блоков
for (c = 0; c < brickColumnCount; c++) { // содержит колонны
  bricks[c] = []
  for (r = 0; r < brickRowCount; r++) { // колонны содержат ряды
    bricks[c][r] = { x: 0, // ряд содердит объект с координатами
                     y: 0,
                     status: 1 } // это для столкновений
  }
}
document.addEventListener("keydown", keyDownHandler, false)
document.addEventListener("keyup", KeyUpHandler, false)
document.addEventListener("mousemove", mouseMoveHandler, false)

function mouseMoveHandler(e) {
  let relativeX = e.clientX - canvas.offsetLeft // зададим гориз позицию как разницу между позицией указателя и левым краем канваса
  if(relativeX > 0 && relativeX < canvas.width) { // если это значение от 0 до ширины канваса - значит указатель внутри канваса
    paddleX = relativeX - paddleWidth / 2 // тогда координаты площадки соответствуют
  }
}



//добавляем реакцию на событие

// когда кнопка нажата - значение true записывается в переменную
function keyDownHandler(e) {
  if(e.keyCode == 39) {
    rightPressed = true
  }
  else if(e.keyCode == 37) {
    leftPressed = true
  }
}

// после того как кнопка отпущенна переменная возвращается в false
function KeyUpHandler(e) {
  if(e.keyCode == 39) {
    rightPressed = false
  }
  else if(e.keyCode == 37) {
    leftPressed = false
  }
}




// определяем столкновение с блоком(пока тупым методом по коорд центра мяча)
function collisionDetection() {
  for(c = 0; c < brickColumnCount; c++) {
    for(r = 0; r < brickRowCount; r++) {
      let b = bricks[c][r]
      if (bricks[c][r].status == 1)
      if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y +brickHeight) {
        dy = -dy //отскок
        b.status = 0 //статус блока 0 (не отрисовывается)
        score++ // счет увел на 1
        if (score == brickRowCount * brickColumnCount) {
          alert('You killed them all and stay alone in whole world, lucky you!')
          document.location.reload()
        }
      }
    }
  }
}

// отображение счета
function drawScore() {
  ctx.font = '15px serif'
  ctx.fillStyle = 'maroon'
  ctx.fillText('DeadBricks: ' + score, 8, 20) // текст переменная и координаты
}

// ф-я для счетчика жизней
function drawLives() {
  ctx.font = '16px serif'
  ctx.fillStyle = 'maroon'
  ctx.fillText('Lives: ' + lives, canvas.width-65, 20)
}
// функция рисует мяч
function drawBall() {
  // if (random_color.checked) {
  //   getRandomColor()
  // }
  ctx.beginPath()
  ctx.arc(x, y, ballRadius, 0, Math.PI*2) //1 и 2 - координаты центра, 3я-радиус, 4и5 начальный/конечный угол отрисовки
                                            // в радианах, направление отрисовки(false по часовой и true против) опционально
  ctx.fillStyle = 'brown'
  ctx.fill()
  ctx.closePath()
}
// рисуем площадку
function drawPaddle() {
  ctx.beginPath()
  ctx.rect(paddleX, canvas.height-paddleHeight, paddleWidth, paddleHeight)
  ctx.fillStyle = 'chocolate'
  ctx.fill()
  ctx.closePath()
}

//  рисуем блоки, проходим по кол и рядам и задаем координаты блоков
function drawBricks() {
  for (c = 0; c < brickColumnCount; c++) {
    for (r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status == 1) { // если статус 1 то рисуем блок
      // определяем коорд. блока по Х это его ширина+отступ между блоками помн. номер колонны + отступ от слева
      let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft
      // коорд. по У это высота+отступ между помн. на номер строки + отступ сверху
      let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop

      bricks[c][r].x = brickX
      bricks[c][r].y = brickY
      ctx.beginPath()// отрисовываем полученые блоки канвасом
      ctx.rect(brickX, brickY, brickWidth, brickHeight)
      ctx.fillStyle = 'coral'
      ctx.fill()
      ctx.closePath()
    }
  }
 }
}
// отрисовка игрового поля
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height) //этот метод очищает поле канваса с принимая аргуметами
  drawBricks() // рисуем кирпичи                                               //1 и 2 коорд. левого верхнего угла и 3 и 4 коорд. правого нижнего
  drawBall() // рисуем мяч
  drawPaddle() // рисуем площадку
  collisionDetection()
  drawScore()
  drawLives()
  //условие отскока от левого и правого краев
  if(x + dx > (canvas.width - ballRadius) || x + dx < ballRadius) {
    dx = -dx
  }

  // отскок от потолка
  if(y + dy < ballRadius) {
    dy = -dy
  }

  // если центр мяча касается площадки - отскок
  else if(y + dy > (canvas.height - ballRadius)) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      if(y = y - paddleHeight) {
      dy = -dy
  }
    }
    // если мяч касается нижнего края - выводим алерт
    else {
      lives--
      if(!lives) {
    alert('Ooops! Something went wrong...your Game is Over, but ' + 'you killed ' + score + ' of them'   )
    document.location.reload()// перезагружаем страницу
    document.querySelector(".btn").style.display = 'block'
}
    else {
      x = canvas.width/2
      y = canvas.height-30
      dx = 3
      dy = -3
      paddleX = (canvas.width - paddleWidth)/2
    }
 }

}
  // движение площадки в рамках окна канваса
  if(rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += 7
  }
  else if (leftPressed && paddleX > 0) {
    paddleX -= 7
  }
  x += dx
  y += dy

requestAnimationFrame(draw)//заменяет собой setInterval передавая отрисовку канваса браузеру по усмотрению
}
// UI перед началом

var start = document.querySelector(".btn");
// console.log(start)
 start.addEventListener("click", function() {
   
   document.querySelector(".btn").style.display = 'none'
   draw()
 });

