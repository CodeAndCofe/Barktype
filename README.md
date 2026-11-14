# barktype

A typing speed test that runs in the browser. You pick a time, press **Start**, and type the text before the clock reaches zero. At the end you see your speed (WPM) and accuracy.

It uses only HTML, CSS and JavaScript. There is nothing to install and no build step.

## How to play

1. Open `index.html` in your browser (or run `python3 -m http.server` in the folder and visit `http://localhost:8000`).
2. Choose the time: **15, 30, 60 or 120** seconds, or type your own number (5 to 600) in the **custom** box.
3. Press **Start**. A text appears and the countdown begins at once.
4. Type the text exactly as you see it. Capital letters, commas and apostrophes all count.
   - A correct letter becomes bright.
   - A wrong letter becomes red.
   - Use **Backspace** to go back and fix a mistake.
5. When the time ends, you see your **WPM**, **accuracy** and **correct keys**. Press **Try again** to play again.

| Key | What it does |
| --- | --- |
| Letters, numbers, symbols, Space | Type the next character |
| Shift | Makes capital letters (works like a normal keyboard) |
| Backspace | Go back one character |
| Tab or Esc | Stop the round and go back to the start screen |

The game is made for a keyboard, so on small screens it asks you to use a laptop.

## How the code works

The project has three files, and each one has one job:

| File | Job | Think of it as |
| --- | --- | --- |
| `index.html` | Puts the elements on the page (timer, text box, buttons) | The skeleton |
| `style.css` | Colors, font, layout, red/gold letters | The clothes |
| `js/game.js` | Reacts to the user, counts time, checks keys | The brain |

HTML and CSS are only a picture. The page becomes **alive** when JavaScript listens to what the user does and then changes the page. The whole game follows this simple loop:

```
User does something  ->  JavaScript reacts  ->  JavaScript changes the page
 (click, key press)       (checks, counts)        (colors, numbers, text)
```

## The life of one round

1. **Page loads.** The state is `idle`, the timer shows the chosen time, and nothing is running.
2. **User presses Start.** `start()` runs. It picks a random text, creates the letters on the page, sets the end time, and starts a timer. The state becomes `run`.
3. **User presses a key.** The `keydown` listener runs, decides if the key is a real character, and sends it to `type()`.
4. **`type()` checks the key.** It compares the key with the letter the user should type. It colors that letter bright or red and moves the caret to the next letter.
5. **Every 0.2 seconds** `tick()` checks the clock and updates the number on the screen.
6. **Time reaches zero.** `finish()` counts the correct letters, calculates WPM and accuracy, and shows the result. The state becomes `done`.

## Main concepts used

### 1. State (the memory of the program)

The program must remember things between actions. These are the important variables in `game.js`:

```js
let state = "idle";   // idle | run | done  -> what the game is doing now
let chars = [];       // every character of the text: ["T","h","e"," ",...]
let spans = [];       // the HTML element of each character
let marks = [];       // 0 = not typed, 1 = correct, 2 = wrong
let idx = 0;          // which character the user must type now (the caret)
```

`chars`, `spans` and `marks` are three lists with the same length. The number `idx` points to the same position in all of them. This is the heart of the game.

The `state` variable is also a safety guard. The key listener starts with `if (state !== "run") return;`, so typing does nothing before the game starts or after it ends.

### 2. The DOM (changing the page from JavaScript)

The browser turns the HTML into objects called the **DOM**. JavaScript can find them and change them:

```js
const box = document.querySelector("#text");   // find an element
const s = document.createElement("span");      // create a new element
s.textContent = c;                              // put a letter inside
box.appendChild(s);                             // add it to the page
```

Every letter of the text is its own `<span>`. That is why one letter can be red while the next one is still grey.

The code adds all the spans through a `DocumentFragment` first and then to the page once. This is faster than adding hundreds of letters one by one.

### 3. Events (how the code listens)

An event is something that happens: a click, a key press, a change in an input. You tell the browser "when this happens, run my function":

```js
go.addEventListener("click", start);     // Start button
document.addEventListener("keydown", e => { ... });   // any key press
custom.addEventListener("input", () => { ... });      // custom time box
```

The `keydown` listener receives an object `e` with information about the key, for example `e.key`.

### 4. Checking the key (and the Shift fix)

```js
if (e.key.length !== 1) return;   // ignore Shift, Caps Lock, arrows, F-keys...
type(e.key);
```

A real character like `a` or `A` has a `key` of length 1. A special key like `"Shift"` or `"ArrowLeft"` is longer, so it is ignored.

This fixes the old bug: before, pressing Shift counted as a wrong key, and the text was changed to lowercase so capital letters could never match. Now the browser already gives `"A"` when Shift is held, and the code compares it exactly with the text:

```js
const ok = k === chars[idx];   // "A" is not equal to "a", on purpose
```

### 5. CSS classes as visual state

The code never writes colors directly. It only switches class names, and the CSS decides how they look:

```js
spans[idx].className = ok ? "ok" : "bad";
```

```css
#text .ok  { color: var(--typed); }     /* bright */
#text .bad { color: var(--err); }       /* red */
#text .cur { box-shadow: inset 2px 0 0 var(--amber); }   /* the caret */
```

The caret is the class `cur` on the current letter, with a blink animation in CSS. The colors come from **CSS variables** at the top of `style.css`, so changing the whole theme means editing a few lines.

### 6. Timers

```js
endAt = Date.now() + duration * 1000;   // the moment the round should end
timer = setInterval(tick, 200);         // run tick() every 200 ms
```

Instead of subtracting 1 each second, the code compares the current time with `endAt`. This stays accurate even if the browser is slow for a moment. `clearInterval(timer)` stops it when the round ends or is cancelled.

### 7. Backspace

Going back is the reverse of typing. The code moves `idx` back by one, sets that mark to 0 and removes the color class:

```js
idx--;
marks[idx] = 0;
spans[idx].className = "";
```

### 8. Scrolling and endless text

The text box shows three lines and hides the rest. After each key, the code reads the position of the current letter (`offsetTop`) and scrolls the box (`scrollTop`) so the current line stays visible. When fewer than 150 characters remain, another random text is added, so even a 10-minute round never runs out.

### 9. Math for the result

```
WPM      = correct characters / 5 / minutes
Accuracy = correct keystrokes / all keystrokes
```

One "word" is counted as 5 characters, which is the standard in typing tests. Accuracy counts every key pressed, so Backspace does not hide your mistakes.

Custom time is protected with a clamp, so it is always between 5 and 600 seconds:

```js
duration = Math.min(600, Math.max(5, Math.round(n) || 30));
```

### 10. Small functions with one job each

| Function | Job |
| --- | --- |
| `append(str)` | Create the letter spans for a text |
| `setCursor()` | Move the caret, scroll, add more text if needed |
| `setDuration(n)` | Validate and set the time |
| `start()` | Begin a round |
| `tick()` | Update the countdown every 0.2 s |
| `type(k)` | Check one key and color the letter |
| `back()` | Undo one character |
| `finish()` | Calculate and show the result |
| `stop()` | Cancel the round and reset the screen |

Small functions are easy to read, test and change.

## Project structure

```
.
├── index.html
├── style.css
└── js
    └── game.js
```

Keep this layout, because `index.html` loads the other files by these paths.

## Customize it

- **Colors:** edit the variables in `:root` at the top of `style.css`.
- **Font:** change `--mono` in `style.css`.
- **Texts:** add sentences to the `TEXTS` list in `js/game.js`. Use only normal keyboard characters (for example `'` and not a curly apostrophe).
- **Time buttons:** change the `data-t` numbers on the buttons in `index.html`.

## Ideas to practice

- Show live WPM while the user types (hint: use `tick()`).
- Save the best score with `localStorage`.
- Add a difficulty mode that uses a list of random words instead of sentences.
- Add a sound or a flash when you type a wrong key.

## Author

Made by [CodeAndCofe](https://github.com/CodeAndCofe).
