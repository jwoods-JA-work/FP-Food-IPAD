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

// Call this function whenever you transition to the quiz screen!
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

// Runs when they click an answer
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
    // Find the container holding the answers
    const answersRow = document.querySelector('.answers-row');
    
    // Grab all the buttons inside it and turn them into an array
    const buttons = Array.from(answersRow.children);
    
    // Mix up the array randomly
    buttons.sort(() => Math.random() - 0.5);
    
    // Put the buttons back into the container in the new mixed-up order!
    // (In JavaScript, appending an element that already exists just moves it)
    buttons.forEach(button => {
        answersRow.appendChild(button);
    });
}

 // This runs automatically whenever a page loads
window.onload = function() {
    updateBudgetDisplay();

    if (document.getElementById('time-display')) startQuizTimer();
    if (document.getElementById('game-board')) startDodgerGame();
    if (document.getElementById('drive-thru-board')) startFastFoodGame();
    if (document.getElementById('tip-game-container')) startTipGame();
};

function makeChoice1(foodType, price) {
    // 1. Math and Memory
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

    // 2. The Traffic Cop: Where do they go next?
    let nextPage = "";

    if (foodType === "groceries") {
        // Send them to the Aisle Dodger game we just built!
        nextPage = "event-groceries1.html"; 
    } 
    else if (foodType === "fastfood") {
        // Send them to the Fast Food mini-game (you will create this file next)
        nextPage = "event-fastfood1.html"; 
    } 
    else if (foodType === "diningout") {
        // Send them to the Dining Out mini-game (you will create this file next)
        nextPage = "event-diningout1.html"; 
    }

    // 3. Show the alert, then go to their specific mini-game!
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
let currentBudget = 60;
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
    updateGame(); // Start animation
}


function spawnItem() {
    if (!isGameActive) return;
    
    const board = document.getElementById('game-board');
    const item = document.createElement('div');
    item.className = 'falling-item';
    
    // 60% chance for an Impulse Buy (Bad), 40% chance for a Deal (Good)
    let isGood = Math.random() > 0.6; 
    item.innerHTML = isGood ? (Math.random() > 0.5 ? '🥦' : '🍎') : (Math.random() > 0.5 ? '🍫' : '🍩');
    item.dataset.type = isGood ? 'good' : 'bad';
    
    // Pick a random spot along the width to drop it
    let xPos = Math.random() * (board.offsetWidth - 40);
    item.style.left = xPos + 'px';
    item.style.top = '-50px';
    
    board.appendChild(item);
    
    // Add it to our tracking array
    fallingItems.push({ 
        element: item, 
        y: -50, 
        type: item.dataset.type,
        speed: 8 + Math.random() * 3 // Random drop speed between 4 and 7
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

        // Collision Detection
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
    // FIX: Assign the loop ID so it can be cancelled later
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
    cancelAnimationFrame(dodgerLoop); // Now this works
    
    // FIX: Get the actual final total from storage
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
let carDirection = 1; // 1 = right, -1 = left
let carSpeed = 12;     // Speed of the car
let driveLoop;
let hasTossed = false;

function startFastFoodGame() {
    // 1. Setup Budget
    let currentBudget = parseInt(localStorage.getItem("budget")) || 60;
    document.getElementById("game-budget").innerText = currentBudget;
    
    // 2. Start the Car Engine
    driveLoop = requestAnimationFrame(moveCar);
}

function moveCar() {
    if (hasTossed) return; // Stop the car so we can see where the bag landed!

    const car = document.getElementById('moving-car');
    
    // Move the car
    carPos += (carSpeed * carDirection);

    // If it hits the right edge (600 board width - 200 car width = 400)
    if (carPos >= 400) {
        carDirection = -1; // Reverse left
        carSpeed = 12; // Randomize speed coming back!
    }
    // If it hits the left edge
    if (carPos <= 0) {
        carDirection = 1; // Reverse right
        carSpeed = 12; // Randomize speed coming back!
    }

    car.style.left = carPos + 'px';

    // Loop the animation
    driveLoop = requestAnimationFrame(moveCar);
}

function tossBag() {
    if (hasTossed) return; // Only allow one throw!
    hasTossed = true;

    // 1. Disable the button
    document.getElementById('toss-btn').disabled = true;

    // 2. Trigger the CSS flying animation
    const bag = document.getElementById('food-bag');
    bag.classList.add('bag-flying');

    // 3. Wait exactly 0.5 seconds (500ms) for the bag to "land", then check collision
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
let tipPos = 0;          // Tracks percentage (0 to 100)
let tipDirection = 1;    // 1 moving right, -1 moving left
let tipSpeed = 4;      // How fast the percentage changes
let tipLoop;
let hasStoppedTip = false;

function startTipGame() {
    // 1. Setup Budget
    let currentBudget = parseInt(localStorage.getItem("budget")) || 60;
    document.getElementById("game-budget").innerText = currentBudget;
    
    // 2. Start the bouncing animation
    tipLoop = requestAnimationFrame(moveTipPointer);
}

function moveTipPointer() {
    if (hasStoppedTip) return;

    const pointer = document.getElementById('tip-pointer');
    
    // Move the pointer's percentage
    tipPos += (tipSpeed * tipDirection);

    // Bounce off the edges (0% and 100%)
    if (tipPos >= 100) {
        tipPos = 100;
        tipDirection = -1;
    } else if (tipPos <= 0) {
        tipPos = 0;
        tipDirection = 1;
    }

    // Apply the position visually
    pointer.style.left = tipPos + '%';

    tipLoop = requestAnimationFrame(moveTipPointer);
}

function stopTipSlider() {
    if (hasStoppedTip) return;
    hasStoppedTip = true;

    // Disable the button
    document.getElementById('stop-tip-btn').disabled = true;

    // Our green target zone in CSS is from 60% to 72%
    let isHit = (tipPos >= 60 && tipPos <= 72);

    // Update Budget
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
    // 1. Math and Memory
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

    // 2. The Traffic Cop: Where do they go next?
    let nextPage = "";
    
    if (foodType === "groceries") {
        // Send them to the Aisle Dodger game we just built!
        nextPage = "event-groceries2.html"; 
    } 
    else if (foodType === "fastfood") {
        // Send them to the Fast Food mini-game (you will create this file next)
        nextPage = "event-fastfood2.html"; 
    } 
    else if (foodType === "diningout") {
        // Send them to the Dining Out mini-game (you will create this file next)
        nextPage = "event-diningout2.html"; 
    }

    // 3. Show the alert, then go to their specific mini-game!
    gameAlert(
        "You bought " + displayName + " for $" + price + ". <br>You have $" + currentBudget + " left.", 
        nextPage 
    );
}

/* ========================================================
   THE SHELF SCAVENGER HUNT GAME
======================================================== */
let scavengeTimer;
let scavengeTimeLeft = 10; // Only 10 seconds!
let targetsFound = 0;
let isScavengeActive = false;

// The pool of possible items
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
    shelf.innerHTML = ""; // Clear shelf
    listUI.innerHTML = ""; // Clear list

    // 1. Pick 3 random target items from the healthy list
    let shuffledHealthy = healthyItems.sort(() => 0.5 - Math.random());
    let targetItems = shuffledHealthy.slice(0, 3);

    // 2. Put the targets on the shopping list UI
    targetItems.forEach(item => {
        let li = document.createElement("li");
        li.innerText = item;
        li.id = "list-" + item; // We give it an ID so we can cross it off later!
        listUI.appendChild(li);
    });

    // 3. Create the pool of items to scatter on the shelf
    // We include our 3 targets, plus a bunch of random junk food distractions
    let itemsToScatter = [...targetItems];
    for (let i = 0; i < 45; i++) {
        // Pick a random item from the junk list to clutter the shelf
        let randomJunk = junkItems[Math.floor(Math.random() * junkItems.length)];
        itemsToScatter.push(randomJunk);

    }

    // Shuffle everything so the targets are hidden among the junk
    itemsToScatter.sort(() => 0.5 - Math.random());

    // 4. Scatter them on the shelf!
    itemsToScatter.forEach(item => {
        let element = document.createElement("div");
        element.className = "grocery-item";
        element.innerText = item;
        
        // Randomly position on the shelf (Width 700, Height 350)
        element.style.left = Math.floor(Math.random() * 630) + "px";
        element.style.top = Math.floor(Math.random() * 280) + "px";

        // Check if this specific element is one of our targets
        let isTarget = targetItems.includes(item);

       // If it's a target, bring it to the front!
if (isTarget) {
    element.style.zIndex = "10"; 
} else {
    element.style.zIndex = "1";
}


        // Add the click event
        element.onclick = function() {
            clickGroceryItem(this, item, isTarget);
        };

        shelf.appendChild(element);
    });

    // 5. Start the clock
    scavengeTimer = setInterval(() => {
        if (!isScavengeActive) return;
        
        scavengeTimeLeft--;
        document.getElementById('game-time').innerText = scavengeTimeLeft;
        
        if (scavengeTimeLeft <= 0) {
            endScavengerGame(false); // They ran out of time!
        }
    }, 1000);
}

function clickGroceryItem(element, item, isTarget) {
    if (!isScavengeActive) return;

    let currentBudget = parseInt(localStorage.getItem("budget"));

    if (isTarget) {
        // CORRECT CLICK!
        element.style.display = "none"; // Hide the item from the shelf
        
        // Cross it off the shopping list
        document.getElementById("list-" + item).classList.add("found-item");
        
        // Prevent clicking the same target twice if duplicates exist
        element.onclick = null; 
        
        targetsFound++;
        
        if (targetsFound >= 3) {
            endScavengerGame(true); // They found all 3!
        }
    } else {
        // WRONG CLICK! (Impulse Buy)
        element.classList.add("wrong-click");
        
        // Remove the animation class after 0.3s so it can flash again if clicked
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
    // 1. Hide the directions overlay
    document.getElementById('game-directions-overlay').style.display = 'none';
    
    // 2. Start the game and the timer!
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

function beginBurgerGame() {
    document.getElementById('game-directions-overlay').style.display = 'none';
    startBurgerGame();
}

function startBurgerGame() {
    let currentBudget = parseInt(localStorage.getItem("budget")) || 60;
    document.getElementById("game-budget").innerText = currentBudget;
    
    isBurgerActive = true;
    burgerTimeLeft = 8;
    playerStack = [];
    document.getElementById('current-burger').innerHTML = "";
    
    // 1. Generate a random 5-layer recipe
    const options = ['Bun', 'Meat', 'Cheese', 'Lettuce'];
    targetRecipe = ['Bun']; // Always starts with a Bun
    for(let i=0; i<3; i++) {
        targetRecipe.push(options[Math.floor(Math.random() * options.length)]);
    }
    targetRecipe.push('Bun'); // Always ends with a Bun

    // 2. Display the recipe
    const display = document.getElementById('recipe-display');
    display.innerHTML = targetRecipe.join("<br>");
    display.style.opacity = "1";

    // 3. Hide the recipe after 3 seconds!
    setTimeout(() => {
        if(isBurgerActive) display.style.opacity = "0";
    }, 3000);

    // 4. Start Countdown
    burgerTimer = setInterval(() => {
        burgerTimeLeft--;
        document.getElementById('game-time').innerText = burgerTimeLeft;
        if (burgerTimeLeft <= 0) endBurgerGame(false);
    }, 1000);
}

function addIngredient(ing) {
    if (!isBurgerActive) return;

    playerStack.push(ing);
    
    // Add visual layer to tray
    const layer = document.createElement("div");
    layer.className = `burger-layer layer-${ing}`;
    layer.innerText = ing;
    document.getElementById('current-burger').appendChild(layer);

    // Check if they messed up the order immediately
    if (playerStack[playerStack.length - 1] !== targetRecipe[playerStack.length - 1]) {
        endBurgerGame(false);
        return;
    }

    // Check if burger is finished
    if (playerStack.length === targetRecipe.length) {
        endBurgerGame(true);
    }
}

function endBurgerGame(isWin) {
    isBurgerActive = false;
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
let balanceAnimationId; // Store the animation ID to properly stop it

function beginBalanceGame() {
    document.getElementById('game-directions-overlay').style.display = 'none';
    startBalanceGame();
}

function startBalanceGame() {
    let currentBudget = parseInt(localStorage.getItem("budget")) || 60;
    document.getElementById("game-budget").innerText = currentBudget;
    
    // 1. Reset State
    isBalanceActive = true;
    balanceTimeLeft = 10;
    balanceAngle = 0;
    document.getElementById('game-time').innerText = balanceTimeLeft;

    const zone = document.getElementById('balance-zone');

    // 2. Input Tracking Function
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

    // 3. Attach Listeners
    window.addEventListener('mousemove', updateCoordinates);
    window.addEventListener('touchstart', updateCoordinates);
    window.addEventListener('touchmove', (e) => {
        updateCoordinates(e);
        if (isBalanceActive) e.preventDefault();
    }, { passive: false });

    // 4. Smooth Movement Engine
    function moveSmoothly() {
        if (!isBalanceActive) return;

        const tray = document.getElementById('tray-surface').getBoundingClientRect();
        
        // Update the path angle
        balanceAngle += 0.03; 
        
        let centerX = (tray.width / 2) - 50;
        let centerY = (tray.height / 2) - 50;
        
        // Calculate new X and Y based on an elliptical path
        let newX = centerX + (Math.cos(balanceAngle) * (tray.width / 3));
        let newY = centerY + (Math.sin(balanceAngle * 0.8) * (tray.height / 3));

        zone.style.left = newX + "px";
        zone.style.top = newY + "px";

        balanceAnimationId = requestAnimationFrame(moveSmoothly);
    }

    balanceAnimationId = requestAnimationFrame(moveSmoothly);

    // 5. Collision Checking (Starts after 1s safety buffer)
    setTimeout(() => {
        if (!isBalanceActive) return;
        checkLoop = setInterval(() => {
            let zRect = zone.getBoundingClientRect();
            let cX = zRect.left + (zRect.width / 2);
            let cY = zRect.top + (zRect.height / 2);
            
            let distance = Math.sqrt(Math.pow(mouseX - cX, 2) + Math.pow(mouseY - cY, 2));
            
            // Fail if distance is too far (60px buffer for fingers)
            if (distance > 60) {
                endBalanceGame(false);
            }
        }, 100);
    }, 1000); 

    // 6. Countdown Timer
    balanceTimer = setInterval(() => {
        balanceTimeLeft--;
        const timeDisplay = document.getElementById('game-time');
        if (timeDisplay) timeDisplay.innerText = balanceTimeLeft;

        if (balanceTimeLeft <= 0) {
            endBalanceGame(true);
        }
    }, 1000);
}

function endBalanceGame(isWin) {
    // 1. Stop everything immediately
    isBalanceActive = false;
    clearInterval(balanceTimer);
    clearInterval(checkLoop);
    cancelAnimationFrame(balanceAnimationId);
    
    // 2. Clean up memory/listeners
    window.removeEventListener('mousemove', null); 
    
    let currentBudget = parseInt(localStorage.getItem("budget"));

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
    
    // 1. Check if the player can actually afford the choice
    if (b < price) {
        gameAlert("You don't have enough money left to buy " + foodType + "!", () => {
            window.location.href = "gameover.html";
        });
        return; // Stop the function here so the game doesn't load
    }

    // 2. Subtract the price and save
    b -= price;
    localStorage.setItem("budget", b);

   let displayName = foodType; 
    if (foodType === "fastfood") displayName = "fast food";
    if (foodType === "diningout") displayName = "dining out";

    // 3. Define where we are going
    let nextPage = "event-" + foodType + "3.html";
    
    // 4. Proceed to the mini-game
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

// Matches HTML: onclick="beginSortGame()"
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
    // Matches HTML ID: items-count
    const countEl = document.getElementById('items-count');
    if(countEl) countEl.innerText = sortItemsLeft;
    
    // Updates the budget on screen
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
    itemEl.style.left = "800px"; // Start at far right

    conveyor.innerHTML = ""; 
    conveyor.appendChild(itemEl);

    requestAnimationFrame(() => moveSortItem(itemEl));
}

function moveSortItem(el) {
    if (!isSortActive || !el.parentNode) return;

    let pos = parseFloat(el.style.left);
    
    // Items move from Right to Left toward the bag
    if (pos > 80) { 
        el.style.left = (pos - itemSpeed) + "px";
        requestAnimationFrame(() => moveSortItem(el));
    } else {
        // It reached the grocery bag!
        if (currentItemType === 'toss') {
            updateBudget(-5); // Penalty for junk in bag
            gameAlert("Oh no! Junk food got into the bag! -$5", "");
        }
        el.remove();
        nextSortItem();
    }
}

// Matches HTML: onclick="handleSort('keep')"
function handleSort(choice) {
    if (!isSortActive) return;
    const itemEl = document.getElementById('active-sort-item');
    if (!itemEl) return;

    if (choice === currentItemType) {
        // Correct! Remove it before it hits the bag
        itemEl.remove();
        nextSortItem();
    } else {
        // Mistake
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
        finishDay3("Shift over! You sorted your groceries.");    
    } else {
        itemSpeed += 0.05; // Slightly faster
        spawnSortItem();
    }
}


function updateBudget(amount) {
    let b = parseInt(localStorage.getItem("budget")) + amount;
    localStorage.setItem("budget", b);
    
    // UI Feedback
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
let chuteSpeed = 15;
let currentColor = "";
let baggingLoop;

function beginBaggingGame() {
    document.getElementById('game-directions-overlay').style.display = 'none';
    baggingActive = true;
    itemsBagged = 0;
    chuteSpeed = 15;
    spawnChuteItem();
}

function spawnChuteItem() {
    if (!baggingActive) return;

    const colors = ['red', 'blue', 'yellow'];
    currentColor = colors[Math.floor(Math.random() * colors.length)];
    
    const item = document.getElementById('chute-item');
    item.style.left = "-100px";
    item.style.borderColor = currentColor; // The border tells the player which bag to pick
    
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
        // Player missed the item!
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
        chuteSpeed += 0.1; // Get faster
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
    garnishActive = false; // Stop the plate
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
