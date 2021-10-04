'use strict'

const SIZE = 4;
const MINES = 2;
const LIFES = 3;
var gStartTime = 0;
var gTimeInterval;
var gReveledMines = 0;
var gIsTime = false;

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
    lives: LIFES
}


function initGame() {
    document.querySelector('h3 span').innerText = gGame.secsPassed;
    document.querySelector('.lives span').innerText = gGame.lives;
    gBoard = [];
    gGame.isOn = true;
    buildBoard(gBoard);
    // console.table(gBoard);
    setMinesNegsCount(gBoard);
    renderBoard(gBoard);
}


function buildBoard(board) {
    for (var i = 0; i < gLevel.size; i++) {
        gBoard[i] = [];
        for (var j = 0; j < gLevel.size; j++) {
            board[i][j] = createCell(0, false, false, false);
        }
    }

    for (var i = 0; i < gLevel.mines; i++) {
        var emptyLocations = getEmptyLocations(board);
        var randomLocation = emptyLocations[getRandomInt(0, emptyLocations.length)];
        board[randomLocation.i][randomLocation.j].isMine = true;
        // console.log(randomLocation)
    }

    // board[0][1].isMine = board[2][1].isMine = true;
}

function createCell(minesAroundCount, isShown, isMine, isMarked) {
    var cell = {
        minesAroundCount: minesAroundCount,
        isShown: isShown,
        isMine: isMine,
        isMarked: isMarked
    }
    return cell;
}




function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            board[i][j].minesAroundCount = countMinesNeg(board, i, j);
        }
    }
}

function renderBoard(board) {
    var strHTML = '';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>\n'
        for (var j = 0; j < board[0].length; j++) {
            var cellClassList = `cell-${i}-${j} `;
            if (!board[i][j].isShown) {
                cellClassList += 'cover';
            }

            strHTML += ` <td class="${cellClassList}" onclick="cellClicked(this, ${i}, ${j})" oncontextmenu="cellMarked(this, ${i} ,${j})"  >  </td>\n`;
        }
        strHTML += '</tr>\n'
    }
    // console.log(strHTML);
    var elTable = document.querySelector('.game-table');
    elTable.innerHTML = strHTML;
}


function cellClicked(elCell, i, j) {

    if (!gGame.isOn) return;

    if (!gIsTime) {
        gIsTime = true;
        gStartTime = Date.now();
        gTimeInterval = setInterval(stoper, 1000);
    }
    if (gBoard[i][j].isShown) return;
    if (gBoard[i][j].isMarked) return;

    gGame.shownCount++;
    // console.log(elCell);
    gBoard[i][j].isShown = true; // model
    elCell.classList.remove('cover'); // DOM

    switch (gBoard[i][j].minesAroundCount) {
        case 0 :
            expandShown(gBoard, elCell, i, j)
            break;
        case 1:
            elCell.innerHTML = `<span style="color: blue;"> ${gBoard[i][j].minesAroundCount} </span>`;
            break;
        case 2:
            elCell.innerHTML = `<span style="color: green;"> ${gBoard[i][j].minesAroundCount} </span>`;
            break;
        case 3:
            elCell.innerHTML = `<span style="color: red;"> ${gBoard[i][j].minesAroundCount} </span>`;
            break;
        case 3:
            elCell.innerHTML = `<span style="color: purple;"> ${gBoard[i][j].minesAroundCount} </span>`;
            break;
    }
    if (gBoard[i][j].isMine) {
        elCell.innerHTML = '<img src="img/bomb.png">';
        gGame.lives--;
        document.querySelector('.lives span').innerText = gGame.lives;
        gReveledMines++;
    }


    checkGameOver();
}

function cellMarked(elCell, i, j) {
    elCell.addEventListener('contextmenu', e => {
        e.preventDefault();
    });
    // console.log(i,j);

    if (!gGame.isOn) return;

    if (!gIsTime) {
        gIsTime = true;
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
    console.log(gGame.shownCount,gGame.markedCount);
    var elEndgame = document.querySelector('.end-game h1');
    if (gGame.lives === 0) {
        console.log('LOSE');
        clearInterval(gTimeInterval);
        gGame.isOn = false;
        elEndgame.innerText = 'You Lose';
        elEndgame.style.display = 'block';
    }
    else if ((gGame.shownCount === gLevel.size ** 2 - gLevel.mines + gReveledMines) && (gGame.markedCount === gLevel.mines - gReveledMines)) {
        console.log('WON');
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
           var elNegCell =  document.querySelector(`.cell-${i}-${j}`);
           elNegCell.classList.remove('cover');
        }
    }
}



function countMinesNeg(board, idxI, idxJ) {
    var mineCount = 0;
    for (var i = idxI - 1; i <= idxI + 1; i++) {
        if (i < 0 || i > board.length - 1) continue;
        for (var j = idxJ - 1; j <= idxJ + 1; j++) {
            if (j < 0 || j > board[0].length - 1) continue;
            if (i === idxI && j === idxJ) continue;
            if (board[i][j].isMine) mineCount++;
        }
    }
    return mineCount;
}


function getEmptyLocations(board) {
    var emptyLocations = [];
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (!board[i][j].isMine) emptyLocations.push({ i: i, j: j });
        }
    }
    return emptyLocations;
}

function stoper() {
    gGame.secsPassed = Math.floor((Date.now() - gStartTime) / 1000);
    document.querySelector('h3 span').innerText = gGame.secsPassed;
}


function setLevel(size, mines) {
    gLevel.size = size;
    gLevel.mines = mines;
    restart();

}

function restart() {
    gIsTime = false;
    gStartTime = 0;
    gReveledMines = 0;
    gGame.shownCount = 0;
    gGame.secsPassed = 0;
    gGame.markedCount = 0;
    gGame.lives = LIFES;
    document.querySelector('.end-game h1').style.display = 'none';
    clearInterval(gTimeInterval);
    initGame();
}
