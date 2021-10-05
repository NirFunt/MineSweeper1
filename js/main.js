'use strict'

const SIZE = 4;
const MINES = 2;
const Lives = 3;

var gStartTime = 0;
var gTimeInterval;
var gReveledMines = 0;
var gIsFirstMove = false;

var gBoard;

var gLevel = {
    size: SIZE,
    mines: MINES
}

var gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: Lives
}


function initGame() {
    updateHeaders(); // update headers of Lives and Time Passed
    gBoard = [];
    gGame.isOn = true; // game is on

    buildBoard(gBoard); // create our Model, the Model will hold all the data needed by object, arrays, etc. the DOM would be updated by taking data from our gBoard model, we can update everytime the DOM to different values by taking different data from our Model as needed for the state of the game
    renderBoard(gBoard); // construct the UI table the data it arriving from our Model gBoard which contains all the data
    takeContexMenuOff(); // after creating all td elements we add to them a lisener to remove the contexmenu of each td

}


function cellClicked(elCell, idxI, idxJ) {

    if (!gGame.isOn) return;

    if (gBoard[idxI][idxJ].isShown) return;
    if (gBoard[idxI][idxJ].isMarked) return;

    gGame.shownCount++;
    // console.log(elCell);
    gBoard[idxI][idxJ].isShown = true; // model
    elCell.classList.remove('cover'); // DOM

    if (!gIsFirstMove) {
        var negCells = getNegLocations(gBoard, idxI, idxJ);
        // console.log(negCells);
        var emptyLocations = getEmptyLocations(gBoard);
        for (var i = 0; i < negCells.length; i++) {
            for (var j = 0; j < emptyLocations.length; j++) {
                if (negCells[i].i === emptyLocations[j].i && negCells[i].j === emptyLocations[j].j) {
                    emptyLocations.splice(j, 1);
                }
            }
        }
        // console.log(emptyLocations);
        for (var k = 0; k < gLevel.mines; k++) {
            var randomLocation = emptyLocations[getRandomInt(0, emptyLocations.length)];
            gBoard[randomLocation.i][randomLocation.j].isMine = true;
            // console.log(randomLocation)
        }

        setMinesNegsCount(gBoard);
        renderBoard(gBoard);
        takeContexMenuOff(); // we need to do it again due to renderBoard again

        gIsFirstMove = true;
        gStartTime = Date.now();
        gTimeInterval = setInterval(stoper, 1000);


    }

    UpdateDOMMinesAroundCount (elCell, idxI, idxJ);
  
    if (gBoard[idxI][idxJ].isMine) {
        elCell.innerHTML = '<img src="img/bomb.png">';
        document.querySelector('.face').src = 'img/supprise-face.jpg';
        gGame.lives--;
        updateHeaders();
        gReveledMines++;
    }


    checkGameOver();
}


function cellMarked(elCell, i, j) {
    // console.log(i,j);
    if (!gGame.isOn) return;

    if (!gIsFirstMove) {
        gIsFirstMove = true;
        gStartTime = Date.now();
        gTimeInterval = setInterval(stoper, 1000);
    }

    if (gBoard[i][j].isShown) return;



    if (gBoard[i][j].isMarked) {
        gBoard[i][j].isMarked = false;
        elCell.innerHTML = '';
        gGame.markedCount--;
    } else {
        gBoard[i][j].isMarked = true;
        elCell.innerHTML = '<img src="img/red-flag.png">';
        gGame.markedCount++;
    }

    checkGameOver();
}


function checkGameOver() {
    // console.log(gGame.shownCount, gGame.markedCount);
    var elEndgame = document.querySelector('.end-game h1');
    if (gGame.lives === 0) {
        document.querySelector('.face').src = 'img/lose-face.jpg';
        // console.log('LOSE');
        clearInterval(gTimeInterval);
        gGame.isOn = false;
        elEndgame.innerText = 'You Lose';
        elEndgame.style.display = 'block';

        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard[0].length; j++) {
                if (gBoard[i][j].isMine) {
                    gBoard[i][j].isShown = true;
                    var elMineCell = document.querySelector(`.cell-${i}-${j}`);
                    // console.log(elMineCell);
                    elMineCell.classList.remove('cover');
                    elMineCell.innerHTML = '<img src="img/bomb.png">';
                }
            }
        }

    }

    else if ((gGame.shownCount === gLevel.size ** 2 - gLevel.mines + gReveledMines) && (gGame.markedCount === gLevel.mines - gReveledMines)) {
        // console.log('WON');
        document.querySelector('.face').src = 'img/won-face.jpg';
        clearInterval(gTimeInterval);
        gGame.isOn = false;
        elEndgame.innerText = 'You Won';
        elEndgame.style.display = 'block';
    }

}


function expandShown(board, elCell, idxI, idxJ) {
    if (gBoard[idxI][idxJ].isMine) return;
    for (var i = idxI - 1; i <= idxI + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = idxJ - 1; j <= idxJ + 1; j++) {
            if (j < 0 || j > board[0].length - 1) continue;
            if (i === idxI && j === idxJ) continue;
            if (gBoard[i][j].isMarked || gBoard[i][j].isMine || gBoard[i][j].isShown) {
                continue;
            }
            board[i][j].isShown = true;
            gGame.shownCount++;
            var elNegCell = document.querySelector(`.cell-${i}-${j}`);
            elNegCell.classList.remove('cover');

            UpdateDOMMinesAroundCount (elNegCell, i, j);
 
        }
    }
}

// update the time passed by taking every 1000ms the Date.now(), also update the headers and faces according to lives
function stoper() {
    gGame.secsPassed = Math.floor((Date.now() - gStartTime) / 1000);
    updateHeaders();
    updateFaceAccodingToLives ();
}

// set the level according to level button that was clicked and restart the game
function setLevel(size, mines) {
    gLevel.size = size;
    gLevel.mines = mines;
    restart();
}

// restart the game after pressing the smily or the level buttons
function restart() {
    document.querySelector('.face').src = 'img/happy.jpg'; // return to original smiley face
    document.querySelector('.end-game h1').style.display = 'none';
   
    // reboot all our counters and variables so they would be ready for new game
    gIsFirstMove = false;
    gStartTime = 0;
    gReveledMines = 0;
    gGame.shownCount = 0;
    gGame.secsPassed = 0;
    gGame.markedCount = 0;
    gGame.lives = Lives;
    
    clearInterval(gTimeInterval); // stop the stopper
    initGame(); // start new game
}

// update headers of Lives and Time Passed
function updateHeaders() {
    document.querySelector('h3 span').innerText = gGame.secsPassed;
    document.querySelector('.lives span').innerText = gGame.lives;
}

// update the smily face according to Lives
function updateFaceAccodingToLives () {
    if (gGame.lives === 3) document.querySelector('.face').src = 'img/happy.jpg';
    else if (gGame.lives === 2) document.querySelector('.face').src = 'img/twolife.jpg';
    else if (gGame.lives === 1) document.querySelector('.face').src = 'img/onelife.jpg';
}

function won () {

}

function lose () {

}

// the function update the DOM td cell showing value of neg mines taken from the model gBoard at same location, update the neg mines value and color it according to its value, in 0 neg case another function is called
function UpdateDOMMinesAroundCount (elCell, idxI, idxJ) {
    switch (gBoard[idxI][idxJ].minesAroundCount) {
        case 0:
            expandShown(gBoard, elCell, idxI, idxJ);
            break;
        case 1:
            elCell.innerHTML = `<span style="color: blue;"> ${gBoard[idxI][idxJ].minesAroundCount} </span>`;
            break;
        case 2:
            elCell.innerHTML = `<span style="color: green;"> ${gBoard[idxI][idxJ].minesAroundCount} </span>`;
            break;
        case 3:
            elCell.innerHTML = `<span style="color: red;"> ${gBoard[idxI][idxJ].minesAroundCount} </span>`;
            break;
        case 4:
            elCell.innerHTML = `<span style="color: purple;"> ${gBoard[idxI][idxJ].minesAroundCount} </span>`;
            break;
    }
}