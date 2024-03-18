// get URL info
function getURLData() {
  var GET = {};
  var query = window.location.search.substring(1).split("&");
  for (let i = 0, max = query.length; i < max; i++) {
    if (query[i] === "") // check for trailing & with no param
      continue;

    let param = query[i].split("=");
    GET[decodeURIComponent(param[0])] = decodeURIComponent(param[1] || "");
  }

  return GET;
}
const URLINFO = getURLData();

// Disable hover on mobile
function watchForHover() {
  let lastTouchTime = 0

  function enableHover() {
    if (new Date() - lastTouchTime < 500) return
    document.body.classList.add('hasHover')
  }

  function disableHover() {
    document.body.classList.remove('hasHover')
  }

  function updateLastTouchTime() {
    lastTouchTime = new Date()
  }

  document.addEventListener('touchstart', updateLastTouchTime, true)
  document.addEventListener('touchstart', disableHover, true)
  document.addEventListener('mousemove', enableHover, true)

  enableHover()
}
watchForHover();

// Sets and Stores Color Schemes
class ColorScheme {
  constructor() {
    this.mode = localStorage.getItem("colorScheme");

    if (this.mode == "system") this.systemMode();
    else if (this.mode == "light") this.lightMode();
    else if (this.mode == "dark") this.darkMode();
    else {
      localStorage.setItem("colorScheme", "system");
      this.mode = "system";
      this.systemMode();
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (this.mode == "system") {
        if (e.matches) this.darkMode();
        else this.lightMode();
        this.mode = "system"
        localStorage.setItem("colorScheme", this.mode);
      }
    })
  }

  systemMode() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) this.darkMode();
    else this.lightMode();
    this.mode = "system";
    localStorage.setItem("colorScheme", this.mode);
  }

  lightMode() {
    this.mode = "light";
    localStorage.setItem("colorScheme", this.mode);
    document.body.classList.remove('dark');
  }

  darkMode() {
    this.mode = "dark";
    localStorage.setItem("colorScheme", this.mode);
    document.body.classList.add('dark');
  }
}
const colorScheme = new ColorScheme();

// Activates dropdown menus
function enableDropdowns() {
  let dropdowns = document.getElementsByClassName("dropdown");

  function closeAllDropdowns() {
    for (let i = 0; i < dropdowns.length; i++) {
      dropdowns[i].classList.remove("active");
    }
  }

  for (let i = 0; i < dropdowns.length; i++) {
    dropdowns[i].querySelector(".dropdownBtn").addEventListener("click", function(event) {
      event.stopPropagation();
      let open = this.parentElement.classList.contains("active");
      closeAllDropdowns();
      if (!open)
        this.parentElement.classList.add("active");
    });
  }

  window.addEventListener("click", closeAllDropdowns);
}
enableDropdowns();

// Called when player wins
function spawnConfetti() {
  var count = 200;
  var defaults = {
    origin: { y: 0.8 },
    shapes: ['square'],
    ticks: 400
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

// Game info class
class Game {
  static styles = {
    normal: "termBtn termBtnNormal",
    selected: "termBtn termBtnSelected",
    correct: null, // to do
    disabled: null, // to do
    pinned: "termBtn", // working on
    back: "termBack"
  }

  constructor(count) {
    this.count = (count > 1) ? count : 2;
    this.moves = 0;
    this.correct = 0;
    this.currentSelection = -1;
    this.pinning = false;
    this.terms = [];
    this.pinned = [];
    this.currentOrder = [];
    this.correctOrder = [];
    this.active = false;

    this.initializeGame();
  }

  togglePinning() {
    this.pinning = !this.pinning;
  }

  generateOrders() {
    let current = [];
    let correct = [];
    let pins = [];

    for (let i = 0; i < this.count; i++) {
      current.push(i);
      correct.push(i);
      pins.push(false);
    }

    correct.sort(() => Math.random() - 0.5);

    // change tolerance?
    for (let i = 0; i < this.count; i++) {
      if (current[i] == correct[i]) {
        this.generateOrders();
        return;
      }
    }

    this.pinned = pins;
    this.currentOrder = current;
    this.correctOrder = correct;
  }

  convertToHue(value) {
    return Math.floor((360 / (this.count + 1)) * value);
  }

  updateTerm(i) {
    let hue = this.convertToHue(this.currentOrder[i]);

    this.terms[i].style.backgroundColor =
      `hsla(${hue}, 90%, 80%, ${this.pinned[i] ? "0.15" : "0.6"})`;

    this.terms[i].style.borderColor =
      `hsla(${hue}, 90%, 40%, 0.6)`;

    this.terms[i].innerHTML = this.currentOrder[i] + 1;

    this.terms[i].className = this.pinned[i] ? Game.styles.pinned : Game.styles.normal;
  }

  updateAllTerms() {
    for (let i = 0; i < this.count; i++) this.updateTerm(i);
  }

  // NEEDS WORK
  calculateScore() {
    if (1 == 1) return 0;

    const b = (this.count * (this.count - 1)) / 2;

    if (this.moves < b) {
      return Math.floor(100 * (9 * ((b - this.moves)
        / (b - (this.count - 1))) + 1));
    }
    else {
      return Math.floor(100 * ((b / this.moves) ** 0.5));
    }
  }

  checkOrder() {
    let correct = 0;
    for (let i = 0; i < this.count; i++) {
      if (this.currentOrder[i] === this.correctOrder[i]) correct++;
    }

    this.correct = correct;
    document.getElementById("numCorrect").innerHTML = `${correct}/${count}`;

    if (correct == this.count) {
      spawnConfetti();
      console.log(this.calculateScore());
    }
  }

  select(i) {
    if (!this.active) return;

    if (this.pinning) {
      this.pinned[i] = !this.pinned[i];
      this.updateTerm(i);
      return
    }

    if (this.pinned[i]) return;

    this.terms[i].className = Game.styles.selected;

    if (this.currentSelection == -1) {
      this.currentSelection = i;
    }
    else if (this.currentSelection == i) {
      this.currentSelection = -1;
      this.updateTerm(i);
    }
    else {
      this.moves++;
      document.getElementById("numMoves").innerHTML = this.moves;

      let s1 = this.currentSelection;
      let s2 = i;
      this.currentSelection = -1;

      let v = this.currentOrder[s1];
      this.currentOrder[s1] = this.currentOrder[s2];
      this.currentOrder[s2] = v;

      setTimeout(() => {
        this.updateTerm(s1);
        this.updateTerm(s2);
        this.checkOrder();
      }, 300);
    }
  }

  generateTerms() {
    for (let i = 0; i < this.count; i++) {
      let back = document.createElement("div");
      back.className = "termBack";
      document.getElementById("playArea").appendChild(back);

      let button = document.createElement("button");
      button.onclick = () => this.select(i);
      back.appendChild(button);

      this.terms.push(button);
      this.updateTerm(i);
    }
  }

  initializeGame() {
    this.generateOrders();
    this.generateTerms();
    this.checkOrder();
    this.active = true;
  }
}

// Start game
const count = (Math.max(parseInt(URLINFO["count"]), 1) - 1 || (6) - 1) + 1;
const game = new Game(count);



// Notes //
// worst logical case: (n(n-1)) / 2
// best case: ceil(n/2)
//
// potential scoring system:
// m = number of moves
// b = (n(n-1))/2
// h(m) = 100(9((b-m)/(b-(n-1)))+1) --> 9? 100?
// g(m) = 100((b/m)**0.5) --> 0.5? 100?
// f(m) = { m < b: h(m), m >= b: g(m) }