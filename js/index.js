custom.addEventListener("input", () => {
	const v = +custom.value;
	custom.classList.toggle("on", v >= 5);
	if (v >= 5) setDuration(v);
});

custom.addEventListener("change", () => {
	if (custom.value === "") return;
	custom.value = Math.min(600, Math.max(5, Math.round(+custom.value) || 30));
	custom.classList.add("on");
	setDuration(+custom.value);
});

function start() {
	clearInterval(timer);
	chars = []; spans = []; marks = []; idx = 0; typed = 0; hits = 0; last = -1;
	box.innerHTML = ""; box.scrollTop = 0;
	append(pick());
	result.style.display = "none"; box.style.display = "";
	config.classList.add("locked");
	go.textContent = "Restart";
	state = "run";
	setCursor();
	endAt = Date.now() + duration * 1000;
	clock.textContent = duration;
	timer = setInterval(tick, 200);
	go.blur();   // so Space/Enter can't re-trigger the button while typing
}

function tick() {
	const left = Math.ceil((endAt - Date.now()) / 1000);
	if (left <= 0) return finish();
	clock.textContent = left;
}

function finish() {
	clearInterval(timer);
	state = "done";
	const correct = marks.filter(m => m === 1).length;
	$("#wpm").textContent = Math.round(correct / 5 / (duration / 60));
	$("#acc").textContent = (typed ? Math.round(hits / typed * 100) : 0) + "%";
	$("#keys").textContent = correct;
	box.style.display = "none"; result.style.display = "flex";
	clock.textContent = "0";
	config.classList.remove("locked");
	go.textContent = "Try again";
}

function stop() {
	clearInterval(timer);
	state = "idle";
	box.style.display = ""; result.style.display = "none";
	box.innerHTML = '<p class="hint">Pick a time, then press Start. The text appears and the clock begins.</p>';
	config.classList.remove("locked");
	go.textContent = "Start";
	clock.textContent = duration;
}

function type(k) {
	const ok = k === chars[idx];            // exact match: Shift gives "A", not "a"
	typed++; if (ok) hits++;
	marks[idx] = ok ? 1 : 2;
	spans[idx].className = ok ? "ok" : "bad";
	idx++;
	setCursor();
}

function back() {
	if (idx === 0) return;
	spans[idx].classList.remove("cur");
	idx--;
	marks[idx] = 0;
	spans[idx].className = "";
	last = -1;
	setCursor();
}

document.addEventListener("keydown", e => {
	if (state !== "run") return;
	if (e.key === "Tab") {e.preventDefault();}
	if (e.key === "Escape") { e.preventDefault(); return stop(); }
	if (e.ctrlKey || e.metaKey || e.altKey) return;
	if (e.key === "Backspace") { e.preventDefault(); return back(); }
	if (e.key.length !== 1) return;          // ignores Shift, CapsLock, arrows, F-keys...
	e.preventDefault();                       // stops Space from scrolling the page
	type(e.key);
});

go.addEventListener("click", start);
setDuration(30);
