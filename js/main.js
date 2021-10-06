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

var gIsHint = false;
var gHint = null;
var gSaveMe = 3;
var gIsManualMode = false;
var gPlacesMines = 0;

var gGameSaves = [];

// initGame() called when HTML page load, and when restart() called
function initGame() {
    updateHeaders(); // update headers of Lives and Time Passed
    gBoard = [];
    gGame.isOn = true; // game is on

    buildBoard(gBoard); // create our Model, the Model will hold all the data needed by object, arrays, etc. the DOM would be updated by taking data from our gBoard model, we can update everytime the DOM to different values by taking different data from our Model as needed for the state of the game
    renderBoard(gBoard); // construct the UI table the data it arriving from our Model gBoard which contains all the data
    takeContexMenuOff(); // after creating all td elements we add to them a lisener to remove the contexmenu of each td
    document.querySelector('.best-score span').innerText = localStorage.getItem(`best-score-level-${gLevel.size}`);
}

// happens when left mouse button clicked on td cell of the DOM table
function cellClicked(elCell, idxI, idxJ) {
    if (!gGame.isOn) return;
    if (gIsManualMode) return;
    if (gBoard[idxI][idxJ].isShown) return;
    if (gBoard[idxI][idxJ].isMarked) return;


    if (gIsHint) {
        // will cover and uncover only the DOM, will use the Model but wont change it, 
        gIsHint = false;
        gHint.classList.add('hint-hide');
        var negLocations = getNegLocations(gBoard, idxI, idxJ);

        for (var i = 0; i < negLocations.length; i++) {
            var loc = negLocations[i];
            var elNegCell = document.querySelector(`.cell-${loc.i}-${loc.j}`)
            elNegCell.classList.remove('cover');

            elNegCell.innerHTML = gBoard[loc.i][loc.j].minesAroundCount;
            if (gBoard[loc.i][loc.j].isMine) elNegCell.innerHTML = '<img src="img/bomb.png">';
        }

        setTimeout(function () {
            for (var i = 0; i < negLocations.length; i++) {
                var loc = negLocations[i];

                var elNegCell = document.querySelector(`.cell-${loc.i}-${loc.j}`)
                if (!gBoard[loc.i][loc.j].isShown) elNegCell.classList.add('cover');
                if (gBoard[loc.i][loc.j].isMine) elNegCell.innerHTML = '';
                if (!gBoard[loc.i][loc.j].isShown) elNegCell.innerHTML = "";
            }
            gHint = null;
        }, 2000);

    } else {

        gGame.shownCount++;
        gBoard[idxI][idxJ].isShown = true; // model
        elCell.classList.remove('cover'); // DOM

        // all this code happens only at first click
        if (!gIsFirstMove) firstMove(idxI, idxJ);
        
        // gGameSaves.unshift(gBoard.slice());
        // slice is not enough, need to copy all cells to new matrix
        gGameSaves.push(copyMatrix(gBoard));
        // copy the gBoard and all its object cells to new board and new cells object with new refernces. in the future I should store also all the gVars for more correct undo()
        console.log(gGameSaves);

        UpdateDOMMinesAroundCount(elCell, idxI, idxJ);

        if (gBoard[idxI][idxJ].isMine) {
            elCell.innerHTML = '<img src="img/bomb.png">';
            document.querySelector('.face').src = 'img/supprise-face.jpg';
            gGame.lives--;
            updateHeaders();
            gReveledMines++;
        }

        checkGameOver();
    }

}

// happens when right mouse button clicked on td cell of the DOM table
function cellMarked(elCell, i, j) {
    // console.log(i,j);
    if (!gGame.isOn) return;

    if (gBoard[i][j].isShown) return;

    if (gIsManualMode) {
        gBoard[i][j].isMine = true;
        elCell.innerHTML = '<img src="img/bomb.png">';
        gIsFirstMove = true;
        gPlacesMines++;
        if (gPlacesMines === gLevel.mines) {
            gIsManualMode = false;
            setMinesNegsCount(gBoard);
            renderBoard(gBoard);
            takeContexMenuOff();
            document.querySelector('body').style.backgroundColor = 'lightskyblue';
            document.querySelector('.end-game h1').style.display = 'none';
        }
       return;
    }


    if (!gIsFirstMove) return;
    // if (!gIsFirstMove) {
    //     firstMove(i, j);
    //     gBoard[i][j].isMarked = true;
    // } 

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

// check if game is over
function checkGameOver() {
    // console.log(gGame.shownCount, gGame.markedCount);

    if (gGame.lives === 0) lose();
    else if ((gGame.shownCount === gLevel.size ** 2 - gLevel.mines + gReveledMines)
        && (gGame.markedCount === gLevel.mines - gReveledMines)) won();
}

// won situation 
function won() {
    var elEndgame = document.querySelector('.end-game h1');
    document.querySelector('.face').src = 'img/won-face.jpg';
    clearInterval(gTimeInterval);
    gGame.isOn = false;
    elEndgame.innerText = 'You Won';
    elEndgame.style.display = 'block';

    var bestScore = localStorage.getItem(`best-score-level-${gLevel.size}`);
    if (gGame.shownCount - gReveledMines > +bestScore) {
        localStorage.setItem(`best-score-level-${gLevel.size}`, gGame.shownCount - gReveledMines);
    }
}

// lose situation 
function lose() {
    var elEndgame = document.querySelector('.end-game h1');
    document.querySelector('.face').src = 'img/lose-face.jpg';
    clearInterval(gTimeInterval);
    gGame.isOn = false;
    elEndgame.innerText = 'You Lose';
    elEndgame.style.display = 'block';

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine) {
                gBoard[i][j].isShown = true;
                var elMineCell = document.querySelector(`.cell-${i}-${j}`);
                elMineCell.classList.remove('cover');
                elMineCell.innerHTML = '<img src="img/bomb.png">';
            }
        }
    }
    var bestScore = localStorage.getItem(`best-score-level-${gLevel.size}`);
    if (gGame.shownCount - gReveledMines > +bestScore) {
        localStorage.setItem(`best-score-level-${gLevel.size}`, gGame.shownCount);
    }
}


// the function called when cell have no bombs negs, it is doing neigbours loops to find all neigbours, if its not bomb, not shown, not flag, then it shows it and put its bomb neg count by UpdateDOMMinesAroundCount
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

            UpdateDOMMinesAroundCount(elNegCell, i, j);

        }
    }
}


// the function update the DOM td cell showing value of neg mines taken from the model gBoard at same location, update the neg mines value and color it according to its value, in 0 neg case another function is called
// so when left mouse button pressed then the innerHTML of elCell update to consist the neg mine count
function UpdateDOMMinesAroundCount(elCell, idxI, idxJ) {
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

// happnes only on the first click
function firstMove(idxI, idxJ) {
    var negCellLocations = getNegLocations(gBoard, idxI, idxJ);
    var emptyLocations = getEmptyLocations(gBoard);

    takeClickedNegLocOff(negCellLocations, emptyLocations);

    setMinesNegsCount(gBoard); // we need to set the mines after the fisrt click, so we wont fall on mine the first time, this function goes over all the board and count mines neg for each cell and enter the data to the model cell object
    renderBoard(gBoard); // we need to render the cells in table (DOM) again because our Model gBoard has changed and now it has mines
    takeContexMenuOff(); // we need to do it again due to renderBoard () again

    gIsFirstMove = true; // condition to make all this block code to happen once at first click

    gStartTime = Date.now(); // take the start time at first click
    gTimeInterval = setInterval(stoper, 1000);
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
    gSaveMe = 3;
    gIsManualMode = false;
    gPlacesMines = 0;
    gGameSaves = [];

    clearInterval(gTimeInterval); // stop the stopper
    initGame(); // start new game
    restartHints();
}

// revels all the hints and change their color back to blue
function restartHints() {
    document.querySelector('.hint1').classList.remove('hint-hide');
    document.querySelector('.hint2').classList.remove('hint-hide');
    document.querySelector('.hint3').classList.remove('hint-hide');
    document.querySelector('.hint1').style.backgroundColor = 'gold';
    document.querySelector('.hint2').style.backgroundColor = 'gold';
    document.querySelector('.hint3').style.backgroundColor = 'gold';
    gHint = null;
}

// update headers of Lives and Time Passed
function updateHeaders() {
    document.querySelector('h3 span').innerText = gGame.secsPassed;
    document.querySelector('.lives span').innerText = gGame.lives;
    document.querySelector('.safe-amount').innerText = gSaveMe;
}

// update the smily face according to Lives
function updateFaceAccodingToLives() {
    if (gGame.lives === 3) document.querySelector('.face').src = 'img/happy.jpg';
    else if (gGame.lives === 2) document.querySelector('.face').src = 'img/twolife.jpg';
    else if (gGame.lives === 1) document.querySelector('.face').src = 'img/onelife.jpg';
}

// update the time passed by taking every 1000ms the Date.now(), also update the headers and faces according to lives
function stoper() {
    gGame.secsPassed = Math.floor((Date.now() - gStartTime) / 1000);
    updateHeaders();
    updateFaceAccodingToLives();
}

// set the level according to level button that was clicked and restart the game
function setLevel(size, mines) {
    gLevel.size = size;
    gLevel.mines = mines;
    restart();
}

// start the hint logic
function hint(elHint) {
    if (!gIsFirstMove) return;
    if (gHint) {
        elHint.style.backgroundColor = 'gold';
        gHint = null;
        gIsHint = false;
        return;
    }
    gIsHint = true;
    elHint.style.backgroundColor = 'yellow';
    gHint = elHint;
}

// this function pick random free location and mark it, it changes back and forth only the DOM, the Model is not changed, just used to get data on the cell (shown, mine, etc)
function saveMe() {
    if (gSaveMe > 0 && gIsFirstMove) {
        gSaveMe--;
        updateHeaders();
        var emptyLocs = getEmptyCoverdLocations(gBoard);
        // console.log(emptyLocs);
        if (!emptyLocs) return // if there is no safe locations we get null
        var randomLocation = emptyLocs[getRandomInt(0, emptyLocs.length)];
        var elMarkedCell = document.querySelector(`.cell-${randomLocation.i}-${randomLocation.j}`);
        elMarkedCell.classList.add('mark');
        setTimeout(function () { elMarkedCell.classList.remove('mark'); }, 2000)
    }
}

function manualMode() {
    if (gIsFirstMove) return;
    if (gPlacesMines === 0) {
        gIsManualMode = true;
        document.querySelector('body').style.backgroundColor = 'brown';
        var elEndgame = document.querySelector('.end-game h1');
        elEndgame.innerText = 'Right Click --> Bombs ';
        elEndgame.style.display = 'block';
    }
   
}

function undo () {
    // should imporve the function by saving all the current gVars with the current gBoard, there are some other issues and bugs, attand to it later
    var board = gGameSaves.pop();
    if (!board) return;
    gBoard = board;
    // console.log(gBoard);
    setMinesNegsCount(gBoard);
    renderBoard(gBoard);
    takeContexMenuOff();
    renderMinesAndAmounts();
}

function sevenBoom () {
    if (gIsFirstMove) return;
    var sevenIdxBombs = [];
    for (var i = 1; i <= gLevel.size**2; i++) {
        if (i % 7 === 0) sevenIdxBombs [i-1] = true;
        else sevenIdxBombs [i-1] = false;
    }
    // console.log(sevenIdxBombs);
    var counter = 0;
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (sevenIdxBombs[counter++]) gBoard[i][j].isMine = true;
        }
    }
    // console.log(gBoard);
    setMinesNegsCount(gBoard); 
    renderBoard(gBoard); 
    takeContexMenuOff(); 
    gIsFirstMove = true;
    gLevel.mines = parseInt((gLevel.size**2)/7);
}

