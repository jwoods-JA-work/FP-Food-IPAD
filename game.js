/* ---------------------------
   CUSTOM POPUP ENGINE
----------------------------*/
function gameAlert(message, nextAction) {
    const overlay = document.createElement("div");
    overlay.id = "custom-alert-overlay";

    const box = document.createElement("div");
    box.id = "custom-alert-box";

    const text = document.createElement("div");
    text.id = "custom-alert-text"; 
    text.innerHTML = message; 

    const btn = document.createElement("button"); 
    btn.id = "custom-alert-btn";
    btn.innerText = "OK";
    
    btn.onclick = () => {
        overlay.remove();
        if (typeof nextAction === "string" && nextAction !== "") {
            window.location.href = nextAction;
        } else if (typeof nextAction === "function") {
            nextAction();
        }
    };

    box.appendChild(text);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

/* ---------------------------
   CORE NAVIGATION
----------------------------*/
function startGame() {
    localStorage.setItem("budget", 60);
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("mission-screen").style.display = "flex";
}

function clickNotePage() {
    window.location.href = "click-note.html";
}

function directionsPage() {
    document.getElementById("click-note-screen").style.display = "none";
    document.getElementById("directions-screen").style.display = "flex";
}

function quizPage() {
    window.location.href = "quiz.html";
}

function day1Page() {
    window.location.href = "day1.html";
}

let timeLeft = 20;
let timerInterval;

function startQuizTimer() {
    if(typeof shuffleAnswers === "function") shuffleAnswers();
    timeLeft = 20;
    const display = document.getElementById('time-display');
    if(display) display.innerText = "00:20";
    timerInterval = setInterval(updateTimer, 1000); 
}

function updateTimer() {
    timeLeft--;
    let seconds = timeLeft < 10 ? "0" + timeLeft : timeLeft;
    const display = document.getElementById('time-display');
    if(display) display.innerText = "00:" + seconds;

    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        gameAlert("Time is up! You lose!", "quiz.html"); 
    }
}

function checkAnswer(isCorrect) {
    clearInterval(timerInterval);
    if (isCorrect) {
        gameAlert("Correct! You planned your spending.", () => {
            document.getElementById("quiz-screen").style.display = "none";
            document.getElementById("reminders-screen").style.display="flex";
        });
    } else {
        gameAlert("Incorrect! Try Again!", "quiz.html");
    }
}

function shuffleAnswers() {
    const answersRow = document.querySelector('.answers-row');
    if(!answersRow) return;
    const buttons = Array.from(answersRow.children);
    buttons.sort(() => Math.random() - 0.5);
    buttons.forEach(button => {
        answersRow.appendChild(button);
    });
}

// ROUTER COUPLING FIX: This runs automatically whenever a page loads
window.onload = function() {
    updateBudgetDisplay();

    if (document.getElementById('time-display')) startQuizTimer();
    if (document.getElementById('game-board')) startDodgerGame();
    if (document.getElementById('drive-thru-board')) startFastFoodGame();
    if (document.getElementById('tip-game-container')) startTipGame();
    
    // FIXED: Removed startBalanceGame() from running on load automatically!
    if (document.getElementById('balance-zone')) {
        // Just sync up the display interface data safely on load instead
        let currentBudget = parseInt(localStorage.getItem("budget")) || 60;
        document.getElementById("game-budget").innerText = currentBudget;
    }
};

function makeChoice1(foodType, price) {
    let currentBudget = parseInt(localStorage.getItem("budget"));
    currentBudget = currentBudget - price;
    localStorage.setItem("budget", currentBudget);

    if (currentBudget <= 0) {
        gameAlert("You spent your last dollar! Game Over.", "gameover.html");
        return;
    }
    localStorage.setItem("day1Choice", foodType);

    let displayName = foodType; 
    if (foodType === "fastfood") displayName = "fast food";
    if (foodType === "diningout") displayName = "dining out";
    if (foodType === "groceries") displayName = "groceries";

    let nextPage = "";
    if (foodType === "groceries") nextPage = "event-groceries1.html"; 
    else if (foodType === "fastfood") nextPage = "event-fastfood1.html"; 
    else if (foodType === "diningout") nextPage = "event-diningout1.html"; 

    gameAlert(
        "You bought " + displayName + " for $" + price + ". <br>You have $" + currentBudget + " left.", 
        nextPage 
    );
}

/* ========================================================
   THE AISLE DODGER GAME
======================================================== */
let dodgerTimer;
let spawnLoop;
let dodgerLoop;
let timeLeftDodger = 20;
let isGameActive = false;
let fallingItems = [];

function startDodgerGame() {
    let currentBudget = parseInt(localStorage.getItem("budget")) || 60;
    updateBudgetDisplay();
    
    isGameActive = true;
    timeLeftDodger = 20;
    fallingItems = [];

    const board = document.getElementById('game-board');
    const cart = document.getElementById('player-cart');
    
    const moveCart = (e) => {
        if (!isGameActive) return;
        let clientX = e.type.includes('mouse') ? e.clientX : (e.touches ? e.touches[0].clientX : 0);
        let boardRect = board.getBoundingClientRect();
        let newLeft = clientX - boardRect.left - (cart.offsetWidth / 2);
        
        if (newLeft < 0) newLeft = 0;
        if (newLeft > board.offsetWidth - cart.offsetWidth) newLeft = board.offsetWidth - cart.offsetWidth;
        cart.style.left = newLeft + 'px';
    };

    board.onmousemove = moveCart;
    board.ontouchmove = moveCart;

    dodgerTimer = setInterval(() => {
        timeLeftDodger--;
        document.getElementById('game-time').innerText = timeLeftDodger;
        if (timeLeftDodger <= 0) endDodgerGame();
    }, 1000);

    spawnLoop = setInterval(spawnItem, 600);
    updateGame();
}

function spawnItem() {
    if (!isGameActive) return;
    
    const board = document.getElementById('game-board');
    const item = document.createElement('div');
    item.className = 'falling-item';
    
    let isGood = Math.random() > 0.6; 
    item.innerHTML = isGood ? (Math.random() > 0.5 ? '🥦' : '🍎') : (Math.random() > 0.5 ? '🍫' : '🍩');
    item.dataset.type = isGood ? 'good' : 'bad';
    
    let xPos = Math.random() * (board.offsetWidth - 40);
    item.style.left = xPos + 'px';
    item.style.top = '-50px';
    
    board.appendChild(item);
    
    fallingItems.push({ 
        element: item, 
        y: -50, 
        type: item.dataset.type,
        speed: 8 + Math.random() * 3
    });
}

function updateGame() {
    if (!isGameActive) return;
    
    const cartElement = document.getElementById('player-cart');
    if(!cartElement) return;
    const cart = cartElement.getBoundingClientRect();
    
    let b = parseInt(localStorage.getItem("budget"));

    for (let i = fallingItems.length - 1; i >= 0; i--) {
        let itemObj = fallingItems[i];
        itemObj.y += itemObj.speed; 
        itemObj.element.style.top = itemObj.y + 'px';

        let itemRect = itemObj.element.getBoundingClientRect();

        if (itemRect.bottom > cart.top && itemRect.top < cart.bottom &&
            itemRect.right > cart.left && itemRect.left < cart.right) {
            
            b += (itemObj.type === 'good' ? 1 : -2);
            localStorage.setItem("budget", Math.max(0, b));
            updateBudgetDisplay();
            
            itemObj.element.remove();
            fallingItems.splice(i, 1);
        } else if (itemObj.y > 500) {
            itemObj.element.remove();
            fallingItems.splice(i, 1);
        }
    }
    dodgerLoop = requestAnimationFrame(updateGame);
}

function updateBudgetDisplay() {
    const bDisplay = document.getElementById('budget-display');
    const gBudget = document.getElementById('game-budget');
    let savedBudget = localStorage.getItem("budget") || 60;
    
    if (bDisplay) bDisplay.innerHTML = "Budget: <br>$" + savedBudget;
    if (gBudget) gBudget.innerText = savedBudget;
}

function endDodgerGame() {
    isGameActive = false;
    clearInterval(dodgerTimer);
    clearInterval(spawnLoop);
    cancelAnimationFrame(dodgerLoop);
    
    let finalTotal = localStorage.getItem("budget");
    
    gameAlert(
        "Shopping trip over! <br><br><span style='color:#2883d4; font-size:32px;'>Final Budget: $" + finalTotal + "</span>", 
        "day2.html"
    );
}

/* ========================================================
   THE DRIVE-THRU TOSS GAME
======================================================== */
let carPos = 0;
let carDirection = 1; 
let carSpeed = 12;     
let driveLoop;
let hasTossed = false;

function startFastFoodGame() {
    let currentBudget = parseInt(localStorage.getItem("budget")) || 60;
    document.getElementById("game-budget").innerText = currentBudget;
    driveLoop = requestAnimationFrame(moveCar);
}

function moveCar() {
    if (hasTossed) return; 

    const car = document.getElementById('moving-car');
    carPos += (carSpeed * carDirection);

    if (carPos >= 400) {
        carDirection = -1; 
        carSpeed = 12; 
    }
    if (carPos <= 0) {
        carDirection = 1; 
        carSpeed = 12; 
    }

    car.style.left = carPos + 'px';
    driveLoop = requestAnimationFrame(moveCar);
}

function tossBag() {
    if (hasTossed) return; 
    hasTossed = true;

    document.getElementById('toss-btn').disabled = true;

    const bag = document.getElementById('food-bag');
    bag.classList.add('bag-flying');

    setTimeout(() => {
        checkTossHit();
    }, 500);
}

function checkTossHit() {
    const windowTarget = document.getElementById('car-window').getBoundingClientRect();
    const bag = document.getElementById('food-bag').getBoundingClientRect();
    let bagCenter = bag.left + (bag.width / 2);
    let isHit = (bagCenter >= windowTarget.left && bagCenter <= windowTarget.right);
    
    let b = parseInt(localStorage.getItem("budget"));

    if (isHit) {
        b += 5;
        localStorage.setItem("budget", b);
        gameAlert("SWISH! 🏀 +$5 Tip!", "day2.html");
    } else {
        b -= 5;
        localStorage.setItem("budget", b);
        gameAlert("SPLAT! 💥 -$5 Repair Fee.", "day2.html");
    }
}

/* ========================================================
   THE TIP CALCULATOR GAME
======================================================== */
let tipPos = 0;          
let tipDirection = 1;    
let tipSpeed = 3;      
let tipLoop;
let hasStoppedTip = false;

function startTipGame() {
    let currentBudget = parseInt(localStorage.getItem("budget")) || 60;
    document.getElementById("game-budget").innerText = currentBudget;
    tipLoop = requestAnimationFrame(moveTipPointer);
}

function moveTipPointer() {
    if (hasStoppedTip) return;

    const pointer = document.getElementById('tip-pointer');
    tipPos += (tipSpeed * tipDirection);

    if (tipPos >= 100) {
        tipPos = 100;
        tipDirection = -1;
    } else if (tipPos <= 0) {
        tipPos = 0;
        tipDirection = 1;
    }

    pointer.style.left = tipPos + '%';
    tipLoop = requestAnimationFrame(moveTipPointer);
}

function stopTipSlider() {
    if (hasStoppedTip) return;
    hasStoppedTip = true;

    document.getElementById('stop-tip-btn').disabled = true;

    let isHit = (tipPos >= 60 && tipPos <= 72);
    let currentBudget = parseInt(localStorage.getItem("budget"));

    if (isHit) {
        currentBudget += 5;
        localStorage.setItem("budget", currentBudget);
        gameAlert(
            "PERFECT 20% TIP! 💰<br>The waiter gave you a $5 loyalty card for your generosity!<br><br><span style='color:#28a745; font-size:32px; font-family: Wendy One;'>New Budget: $" + currentBudget + "</span>",
            "day2.html"
        );
    } else {
        currentBudget -= 8;
        localStorage.setItem("budget", currentBudget);
        
        let mistakeMessage = tipPos > 72 ? "You tipped way too much!" : "You got confused by the math!";
        
        gameAlert(
            "MATH ERROR! ❌<br>" + mistakeMessage + " You accidentally lost $8.<br><br><span style='color:#e74c3c; font-size:32px; font-family: Wendy One;'>New Budget: $" + currentBudget + "</span>",
            "day2.html"
        );
    }
}

function makeChoice2(foodType, price) {
    let currentBudget = parseInt(localStorage.getItem("budget"));
    currentBudget = currentBudget - price;
    localStorage.setItem("budget", currentBudget);

    if (currentBudget <= 0) {
        gameAlert("You spent your last dollar! Game Over.", "gameover.html");
        return;
    }
    localStorage.setItem("day2Choice", foodType); 

    let displayName = foodType; 
    if (foodType === "fastfood") displayName = "fast food";
    if (foodType === "diningout") displayName = "dining out";
    if (foodType === "groceries") displayName = "groceries";

    let nextPage = "";
    if (foodType === "groceries") nextPage = "event-groceries2.html"; 
    else if (foodType === "fastfood") nextPage = "event-fastfood2.html"; 
    else if (foodType === "diningout") nextPage = "event-diningout2.html"; 

    gameAlert(
        "You bought " + displayName + " for $" + price + ". <br>You have $" + currentBudget + " left.", 
        nextPage 
    );
}

/* ========================================================
   THE SHELF SCAVENGER HUNT GAME
======================================================== */
let scavengeTimer;
let scavengeTimeLeft = 10; 
let targetsFound = 0;
let isScavengeActive = false;

const healthyItems = ['🍎', '🍞', '🥛', '🥚', '🧀', '🥦', '🍌', '🍗'];
const junkItems = ['🍫', '🍩', '🍪', '🥤', '🍕', '🍟', '🍦', '🍬'];

function startScavengerGame() {
    let currentBudget = parseInt(localStorage.getItem("budget")) || 60;
    document.getElementById("game-budget").innerText = currentBudget;
    
    isScavengeActive = true;
    scavengeTimeLeft = 10;
    targetsFound = 0;
    document.getElementById('game-time').innerText = scavengeTimeLeft;

    const shelf = document.getElementById("shelf-board");
    const listUI = document.getElementById("target-list-ui");
    shelf.innerHTML = ""; 
    listUI.innerHTML = ""; 

    let shuffledHealthy = healthyItems.sort(() => 0.5 - Math.random());
    let targetItems = shuffledHealthy.slice(0, 3);

    targetItems.forEach(item => {
        let li = document.createElement("li");
        li.innerText = item;
        li.id = "list-" + item; 
        listUI.appendChild(li);
    });

    let itemsToScatter = [...targetItems];
    for (let i = 0; i < 100; i++) {
        let randomJunk = junkItems[Math.floor(Math.random() * junkItems.length)];
        itemsToScatter.push(randomJunk);
    }

    itemsToScatter.sort(() => 0.5 - Math.random());

    itemsToScatter.forEach(item => {
        let element = document.createElement("div");
        element.className = "grocery-item";
        element.innerText = item;
        
        element.style.left = Math.floor(Math.random() * 630) + "px";
        element.style.top = Math.floor(Math.random() * 280) + "px";

        let isTarget = targetItems.includes(item);
        element.style.zIndex = isTarget ? "10" : "1";

      if (isTarget) {
         element.classList.add("target-glow");
      }

        element.onclick = function() {
            clickGroceryItem(this, item, isTarget);
        };

        shelf.appendChild(element);
    });

    scavengeTimer = setInterval(() => {
        if (!isScavengeActive) return;
        
        scavengeTimeLeft--;
        document.getElementById('game-time').innerText = scavengeTimeLeft;
        
        if (scavengeTimeLeft <= 0) {
            endScavengerGame(false); 
        }
    }, 1000);
}

function clickGroceryItem(element, item, isTarget) {
    if (!isScavengeActive) return;

    let currentBudget = parseInt(localStorage.getItem("budget"));

    if (isTarget) {
        element.style.display = "none"; 
        document.getElementById("list-" + item).classList.add("found-item");
        element.onclick = null; 
        targetsFound++;
        
        if (targetsFound >= 3) {
            endScavengerGame(true); 
        }
    } else {
        element.classList.add("wrong-click");
        setTimeout(() => element.classList.remove("wrong-click"), 300);
        
        currentBudget -= 3;
        localStorage.setItem("budget", currentBudget);
        document.getElementById("game-budget").innerText = currentBudget;
    }
}

function endScavengerGame(isWin) {
    isScavengeActive = false;
    clearInterval(scavengeTimer);
    
    let currentBudget = parseInt(localStorage.getItem("budget"));

    if (isWin) {
        currentBudget += 5;
        localStorage.setItem("budget", currentBudget);
        gameAlert(
            "LIST COMPLETE! 🛒<br>You found everything fast and earned a $5 Smart Shopper bonus!<br><br><span style='color:#28a745; font-size:32px; font-family: Wendy One;'>New Budget: $" + currentBudget + "</span>",
            "day3.html"
        );
    } else {
        currentBudget -= 5;
        localStorage.setItem("budget", currentBudget);
        gameAlert(
            "TIME'S UP! ⏰<br>You took too long and had to buy overpriced convenience store food. Lose $5.<br><br><span style='color:#e74c3c; font-size:32px; font-family: Wendy One;'>New Budget: $" + currentBudget + "</span>",
            "day3.html"
        );
    }
}

function beginScavengerHunt() {
    document.getElementById('game-directions-overlay').style.display = 'none';
    startScavengerGame();
}

/* ========================================================
   THE BURGER BUILDER GAME
======================================================== */
let burgerTimer;
let burgerTimeLeft = 8;
let targetRecipe = [];
let playerStack = [];
let isBurgerActive = false;
let canBuild = false; 

function beginBurgerGame() {
    document.getElementById('game-directions-overlay').style.display = 'none';
    startBurgerGame();
}

function startBurgerGame() {
    let currentBudget = parseInt(localStorage.getItem("budget")) || 60;
    document.getElementById("game-budget").innerText = currentBudget;
    
    isBurgerActive = true;
    canBuild = false; 
    burgerTimeLeft = 8;
    playerStack = [];
    document.getElementById('current-burger').innerHTML = "";
    
    const options = ['Bun', 'Meat', 'Cheese', 'Lettuce'];
    targetRecipe = ['Bun']; 
    for(let i=0; i<3; i++) {
        targetRecipe.push(options[Math.floor(Math.random() * options.length)]);
    }
    targetRecipe.push('Bun'); 

    const display = document.getElementById('recipe-display');
    display.innerHTML = targetRecipe.join("<br>");
    display.style.opacity = "1";

    setTimeout(() => {
        if(isBurgerActive) {
            display.style.opacity = "0";
            canBuild = true; 
        }
    }, 3000);

    burgerTimer = setInterval(() => {
        burgerTimeLeft--;
        document.getElementById('game-time').innerText = burgerTimeLeft;
        if (burgerTimeLeft <= 0) endBurgerGame(false);
    }, 1000);
}

function addIngredient(ing) {
    if (!isBurgerActive || !canBuild) return;

    playerStack.push(ing);
    
    const layer = document.createElement("div");
    layer.className = `burger-layer layer-${ing}`;
    layer.innerText = ing;
    document.getElementById('current-burger').appendChild(layer);

    if (playerStack[playerStack.length - 1] !== targetRecipe[playerStack.length - 1]) {
        endBurgerGame(false);
        return;
    }

    if (playerStack.length === targetRecipe.length) {
        endBurgerGame(true);
    }
}

function endBurgerGame(isWin) {
    isBurgerActive = false;
    canBuild = false; 
    clearInterval(burgerTimer);
    
    let currentBudget = parseInt(localStorage.getItem("budget"));

    if (isWin) {
        currentBudget += 5;
        localStorage.setItem("budget", currentBudget);
        gameAlert("PERFECT ORDER! 🍔<br>The manager is impressed. You earned a $5 bonus!", "day3.html");
    } else {
        currentBudget -= 3;
        localStorage.setItem("budget", currentBudget);
        gameAlert("ORDER WRONG! ❌<br>You wasted ingredients and had to pay $3 out of pocket.", "day3.html");
    }
}
/* ========================================================
   THE BALANCE THE TRAY GAME (Fixed & Optimized)
======================================================== */
let balanceTimer;
let checkLoop;
let balanceTimeLeft = 10;
let isBalanceActive = false;
let mouseX = 0;
let mouseY = 0;
let balanceAngle = 0;
let balanceAnimationId; 

// Input Tracking Function Named For Unbinding
function updateCoordinates(e) {
    if (!isBalanceActive) return;
    if (e.touches && e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    } else {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }
}

// CALLED BY THE BUTTON CLICK
function beginBalanceGame() {
    // 1. Hide the directions screen
    document.getElementById('game-directions-overlay').style.display = 'none';
    
    // 2. Fire up the gameplay loop
    startBalanceGame();
}

function startBalanceGame() {
    let currentBudget = parseInt(localStorage.getItem("budget")) || 60;
    document.getElementById("game-budget").innerText = currentBudget;
    
    isBalanceActive = true;
    balanceTimeLeft = 10;
    balanceAngle = 0;
    document.getElementById('game-time').innerText = balanceTimeLeft;

    // Attach Listeners
    window.addEventListener('mousemove', updateCoordinates);
    window.addEventListener('touchstart', updateCoordinates);
    window.addEventListener('touchmove', (e) => {
        updateCoordinates(e);
        if (isBalanceActive) e.preventDefault();
    }, { passive: false });

    // Set initial target positions so the ball doesn't instantly think it's off-screen
    const zone = document.getElementById('balance-zone');
    if (zone) {
        let zRect = zone.getBoundingClientRect();
        mouseX = zRect.left + (zRect.width / 2);
        mouseY = zRect.top + (zRect.height / 2);
    }

    balanceAnimationId = requestAnimationFrame(moveSmoothly);

    // Collision Checking (Starts after 3s safety buffer)
    setTimeout(() => {
        if (!isBalanceActive) return;
        checkLoop = setInterval(() => {
            const zone = document.getElementById('balance-zone');
            if(!zone) return;
            let zRect = zone.getBoundingClientRect();
            let cX = zRect.left + (zRect.width / 2);
            let cY = zRect.top + (zRect.height / 2);
            
            let distance = Math.sqrt(Math.pow(mouseX - cX, 2) + Math.pow(mouseY - cY, 2));
            
            if (distance > 60) {
                endBalanceGame(false);
            }
        }, 100);
    }, 3000); // 3 seconds of free movement!

    balanceTimer = setInterval(() => {
        balanceTimeLeft--;
        const timeDisplay = document.getElementById('game-time');
        if (timeDisplay) timeDisplay.innerText = balanceTimeLeft;

        if (balanceTimeLeft <= 0) {
            endBalanceGame(true);
        }
    }, 1000);
}

function moveSmoothly() {
    if (!isBalanceActive) return;

    const zone = document.getElementById('balance-zone');
    const tray = document.getElementById('tray-surface');
    if(!zone || !tray) return;

    const trayRect = tray.getBoundingClientRect();
    
    balanceAngle += 0.03; 
    
    let centerX = (trayRect.width / 2) - 50;
    let centerY = (trayRect.height / 2) - 50;
    
    let newX = centerX + (Math.cos(balanceAngle) * (trayRect.width / 3));
    let newY = centerY + (Math.sin(balanceAngle * 0.8) * (trayRect.height / 3));

    zone.style.left = newX + "px";
    zone.style.top = newY + "px";

    balanceAnimationId = requestAnimationFrame(moveSmoothly);
}

function endBalanceGame(isWin) {
    if (!isBalanceActive) return; 
    
    isBalanceActive = false;
    
    clearInterval(balanceTimer);
    clearInterval(checkLoop);
    cancelAnimationFrame(balanceAnimationId);
    
    window.removeEventListener('mousemove', updateCoordinates); 
    window.removeEventListener('touchstart', updateCoordinates); 
    
    let currentBudget = parseInt(localStorage.getItem("budget")) || 60;

    if (isWin) {
        currentBudget += 5;
        localStorage.setItem("budget", currentBudget);
         gameAlert("STEADY HANDS! 🍷<br>You delivered the meal perfectly. $5 bonus tip!", "day3.html");
    } else {
        currentBudget -= 10;
        localStorage.setItem("budget", currentBudget);
         gameAlert("CRASH! 💥<br>You dropped the tray! Pay $10 for broken dishes.", "day3.html");     
    }
}

/* ========================================================
   CHOICE 3 & NAVIGATION
======================================================== */
function makeChoice3(foodType, price) {
    let b = parseInt(localStorage.getItem("budget")) || 0;
    
    let displayName = foodType; 
    if (foodType === "fastfood") displayName = "fast food";
    if (foodType === "diningout") displayName = "dining out";
    if (foodType === "groceries") displayName = "groceries";
    
    if (b < price) {
        gameAlert("You don't have enough money left to buy " + displayName + "!", () => {
            window.location.href = "gameover.html";
        });
        return; 
    }

    b -= price;
    localStorage.setItem("budget", b);
    localStorage.setItem("day3Choice", foodType); 

    let nextPage = "event-" + foodType + "3.html";
    
    gameAlert(
        "You bought " + displayName + " for $" + price + ". <br>Remaining Budget: $" + b, 
        nextPage
    );
}

/* ---------------------------
   FINAL OUTCOME LOGIC
----------------------------*/
function finishDay3(message) {
    let finalBudget = parseInt(localStorage.getItem("budget"));
    if (finalBudget > 0) {
        gameAlert(message + "<br><br><b>Final Budget: $" + finalBudget + "</b>", "victory.html");
    } else {
        window.location.href = "gameover.html";
    }
}

function checkBudgetStatus() {
    let b = parseInt(localStorage.getItem("budget"));
    if (b <= 0) {
        window.location.href = "gameover.html";
        return true; 
    }
    return false;
}

/* ========================================================
   THE CHECKOUT SORT GAME (Groceries 3)
======================================================== */
let sortItemsLeft = 10;
let isSortActive = false;
let currentItemType = ""; 
let itemSpeed = 10;

function beginSortGame() {
    const overlay = document.getElementById('game-directions-overlay');
    if(overlay) overlay.style.display = 'none';

    sortItemsLeft = 10;
    isSortActive = true;
    itemSpeed = 10;
    
    updateSortUI();
    spawnSortItem();
}

function updateSortUI() {
    const countEl = document.getElementById('items-count');
    if(countEl) countEl.innerText = sortItemsLeft;
    
    const budgetEl = document.getElementById('game-budget');
    if(budgetEl) budgetEl.innerText = localStorage.getItem("budget") || 60;
}

function spawnSortItem() {
    if (!isSortActive) return;

    const conveyor = document.getElementById('conveyor-belt');
    const items = [
        { emoji: '🥦', type: 'keep' },
        { emoji: '🍎', type: 'keep' },
        { emoji: '🥚', type: 'keep' },
        { emoji: '🍩', type: 'toss' },
        { emoji: '🍬', type: 'toss' },
        { emoji: '🥤', type: 'toss' }
    ];

    const choice = items[Math.floor(Math.random() * items.length)];
    currentItemType = choice.type;

    const itemEl = document.createElement('div');
    itemEl.id = "active-sort-item";
    itemEl.className = "sort-item";
    itemEl.innerText = choice.emoji;
    itemEl.style.left = "800px"; 

    conveyor.innerHTML = ""; 
    conveyor.appendChild(itemEl);

    requestAnimationFrame(() => moveSortItem(itemEl));
}

function moveSortItem(el) {
    if (!isSortActive || !el.parentNode) return;

    let pos = parseFloat(el.style.left);
    
    if (pos > 80) { 
        el.style.left = (pos - itemSpeed) + "px";
        requestAnimationFrame(() => moveSortItem(el));
    } else {
        if (currentItemType === 'toss') {
            isSortActive = false; 
            updateBudget(-5); 
            el.remove(); 
            gameAlert("Oh no! Junk food got into the bag! -$5", resumeGameAfterAlert);
        } else {
            el.remove();
            nextSortItem();
        }
    }
}

function resumeGameAfterAlert() {
    isSortActive = true;
    nextSortItem();
}

function handleSort(choice) {
    if (!isSortActive) return; 
    
    const itemEl = document.getElementById('active-sort-item');
    if (!itemEl) return;

    if (choice === currentItemType) {
        itemEl.remove();
        nextSortItem();
    } else {
        updateBudget(-3);
        itemEl.classList.add('wrong-flash');
        setTimeout(() => {
            itemEl.remove();
            nextSortItem();
        }, 200);
    }
}

function nextSortItem() {
    sortItemsLeft--;
    updateSortUI();
    
    if (sortItemsLeft <= 0) {
        isSortActive = false;
        finishDay3("You sorted your groceries.");    
    } else {
        itemSpeed += 0.05; 
        spawnSortItem();
    }
}

function updateBudget(amount) {
    let b = parseInt(localStorage.getItem("budget")) + amount;
    localStorage.setItem("budget", b);
    
    const gBudget = document.getElementById('game-budget');
    if(gBudget) gBudget.innerText = b; 
    
    updateBudgetDisplay();
    checkBudgetStatus();
}

/* ========================================================
   THE BAGGING RUSH GAME (Fast Food 3)
======================================================== */
let baggingActive = false;
let itemsBagged = 0;
let chuteSpeed = 12;
let currentColor = "";
let baggingLoop;

function beginBaggingGame() {
    document.getElementById('game-directions-overlay').style.display = 'none';
    baggingActive = true;
    itemsBagged = 0;
    chuteSpeed = 12;
    spawnChuteItem();
}

function spawnChuteItem() {
    if (!baggingActive) return;

    const colors = ['red', 'blue', 'yellow'];
    currentColor = colors[Math.floor(Math.random() * colors.length)];
    
    const item = document.getElementById('chute-item');
    item.style.left = "-100px";
    item.style.borderColor = currentColor; 
    
    moveChuteItem();
}

function moveChuteItem() {
    if (!baggingActive) return;

    const item = document.getElementById('chute-item');
    let pos = parseInt(item.style.left);

    if (pos < 600) {
        item.style.left = (pos + chuteSpeed) + "px";
        baggingLoop = requestAnimationFrame(moveChuteItem);
    } else {
        updateBaggingBudget(-2);
        spawnChuteItem();
    }
}

function checkBag(bagColor) {
    if (!baggingActive) return;
    cancelAnimationFrame(baggingLoop);

    if (bagColor === currentColor) {
        itemsBagged++;
        document.getElementById('items-bagged').innerText = itemsBagged;
        chuteSpeed += 0.1; 
    } else {
        updateBaggingBudget(-3);
    }

    if (itemsBagged >= 10) {
        baggingActive = false;
        let finalB = parseInt(localStorage.getItem("budget")) + 5;
        localStorage.setItem("budget", finalB);
        finishDay3("Shift done! You earned a $5 efficiency bonus.");
    } else {
        spawnChuteItem();
    }
}

function updateBaggingBudget(amt) {
    let b = parseInt(localStorage.getItem("budget")) + amt;
    localStorage.setItem("budget", b);
    document.getElementById('game-budget').innerText = b;
    checkBudgetStatus();
}

/* ========================================================
   THE FANCY GARNISH GAME (Dining Out 3)
======================================================== */
let garnishActive = false;
let platePos = 0;
let plateDirection = 1;
let plateSpeed = 10;
let garnishLoop;

function beginGarnishGame() {
    document.getElementById('game-directions-overlay').style.display = 'none';
    garnishActive = true;
    animatePlate();
}

function animatePlate() {
    if (!garnishActive) return;

    const plate = document.getElementById('moving-plate');
    platePos += (plateSpeed * plateDirection);

    if (platePos >= 580 || platePos <= 0) {
        plateDirection *= -1;
    }

    plate.style.left = platePos + "px";
    garnishLoop = requestAnimationFrame(animatePlate);
}

function dropGarnish() {
    if (!garnishActive) return;
    garnishActive = false; 
    cancelAnimationFrame(garnishLoop);

    const garnish = document.getElementById('falling-garnish');
    garnish.classList.add('garnish-falling-anim');

    setTimeout(() => {
        checkGarnishHit();
    }, 600);
}

function checkGarnishHit() {
    const target = document.getElementById('chefs-circle').getBoundingClientRect();
    const garnish = document.getElementById('falling-garnish').getBoundingClientRect();

    let garnishCenter = garnish.left + (garnish.width / 2);
    let isHit = (garnishCenter >= target.left && garnishCenter <= target.right);

    let b = parseInt(localStorage.getItem("budget"));

    if (isHit) {
        b += 10;
        localStorage.setItem("budget", b);
        finishDay3("MASTERPIECE! 🌿 The plating is perfect. You earned a $10 bonus tip!");    
    } else {
        b -= 10;
        localStorage.setItem("budget", b);
        finishDay3("MESSY! 😱 You missed the plate and wasted the garnish. -$10 penalty.");    
    }
}
