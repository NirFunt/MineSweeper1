'use strict'

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
    if(!confirm('Do You to put the Bombs?')) return;
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
    // if (gIsFirstUndo) {
    //     gGameSaves.pop();
    //     gIsFirstUndo = false;
    // }
    // gIsFirstUndo = true;

    // if (gGameSaves.length > 1) {
        var savedGame = gGameSaves[gGameSaves.length-2];
        console.log(gGameSaves.length-2);
        console.log(gGameSaves);
        var board = savedGame.board;
        gBoard = board;
        // console.log(gBoard);
        gGame.lives = savedGame.life;
    // }
  
    setMinesNegsCount(gBoard);
    renderBoard(gBoard);
    takeContexMenuOff();
    renderMinesAndAmounts();
    gGameSaves.pop();
}

function sevenBoom () {
    if (gIsFirstMove) return;
    if(!confirm('Do You Want To Play 7 BOOM?')) return;
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
