class TowerOfHanoi {
	static MIN_DISKS = 3;
	static MAX_DISKS = 8;
	static ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

	constructor() {
		this.diskCount = 4;
		this.towers = [[], [], []];
		this.moves = 0;
		this.isComplete = false;

		this.initDOM();
		this.bindEvents();
		this.updateSetupPreview();
	}

	initDOM() {
		this.dom = {
			setupScreen: document.getElementById('setupScreen'),
			gameScreen: document.getElementById('gameScreen'),
			stacks: [
				document.getElementById('stack0'),
				document.getElementById('stack1'),
				document.getElementById('stack2')
			],
			towerEls: document.querySelectorAll('.tower'),
			moveCountEl: document.getElementById('moveCount'),
			minMovesEl: document.getElementById('minMoves'),
			minMovesPreviewEl: document.getElementById('minMovesPreview'),
			diskCountEl: document.getElementById('diskCount'),
			riteNote: document.getElementById('riteNote'),
			decBtn: document.getElementById('dec'),
			incBtn: document.getElementById('inc'),
			beginBtn: document.getElementById('beginBtn'),
			backBtn: document.getElementById('backBtn')
		};
	}

	bindEvents() {
		this.dom.decBtn.addEventListener('click', () => this.changeDiskCount(-1));
		this.dom.incBtn.addEventListener('click', () => this.changeDiskCount(1));
		
		this.dom.beginBtn.addEventListener('click', () => {
			this.startGame();
			this.switchScreen(this.dom.setupScreen, this.dom.gameScreen);
		});

		this.dom.backBtn.addEventListener('click', () => {
			this.switchScreen(this.dom.gameScreen, this.dom.setupScreen);
		});
	}

	get minimumMoves() {
		return Math.pow(2, this.diskCount) - 1;
	}

	changeDiskCount(delta) {
		const newCount = this.diskCount + delta;
		if (newCount >= TowerOfHanoi.MIN_DISKS && newCount <= TowerOfHanoi.MAX_DISKS) {
			this.diskCount = newCount;
			this.updateSetupPreview();
		}
	}

	updateSetupPreview() {
		this.dom.diskCountEl.textContent = String(this.diskCount);
		this.dom.minMovesPreviewEl.textContent = String(this.minimumMoves);
		this.dom.decBtn.disabled = this.diskCount <= TowerOfHanoi.MIN_DISKS;
		this.dom.incBtn.disabled = this.diskCount >= TowerOfHanoi.MAX_DISKS;
	}

	switchScreen(fromScreen, toScreen) {
		fromScreen.classList.remove('is-active');
		toScreen.classList.add('is-active');
	}

	startGame() {
		this.towers = [[], [], []];
		for (let i = this.diskCount; i >= 1; i--) {
			this.towers[0].push(i);
		}

		this.moves = 0;
		this.isComplete = false;
		
		this.dom.moveCountEl.textContent = '0';
		this.dom.minMovesEl.textContent = String(this.minimumMoves);
		this.dom.riteNote.textContent = 'Drag the topmost ring of a tower to move it.';
		this.dom.riteNote.classList.remove('is-complete');
		
		this.render();
	}

	calculateDiskWidth(size) {
		const minWidth = 34;
		const maxWidth = 92;
		if (this.diskCount === 1) return maxWidth;
		return minWidth + (maxWidth - minWidth) * ((size - 1) / (this.diskCount - 1));
	}

	render() {
		this.dom.stacks.forEach((stackEl, towerIdx) => {
			stackEl.innerHTML = '';
			
			this.towers[towerIdx].forEach((size, diskIdx) => {
				const diskEl = document.createElement('div');
				diskEl.className = 'disk';
				diskEl.style.setProperty('--w', `${this.calculateDiskWidth(size)}%`);
				diskEl.textContent = TowerOfHanoi.ROMAN_NUMERALS[size - 1] || String(size);
				diskEl.dataset.size = size;

				const isTopDisk = diskIdx === this.towers[towerIdx].length - 1;
				if (isTopDisk && !this.isComplete) {
					diskEl.classList.add('is-draggable');
					this.attachDragListener(diskEl, towerIdx);
				}

				stackEl.appendChild(diskEl);
			});
		});
	}

	attachDragListener(diskEl, fromTowerIdx) {
		diskEl.addEventListener('pointerdown', (e) => {
			if (this.isComplete) return;
			e.preventDefault();

			const startRect = diskEl.getBoundingClientRect();
			const offsetX = e.clientX - startRect.left;
			const offsetY = e.clientY - startRect.top;
			const diskSize = Number(diskEl.dataset.size);

			diskEl.classList.add('is-ghost');

			const flyingDisk = diskEl.cloneNode(true);
			flyingDisk.classList.remove('is-ghost');
			flyingDisk.classList.add('is-flying');
			flyingDisk.style.width = `${startRect.width}px`;
			flyingDisk.style.height = `${startRect.height}px`;
			flyingDisk.style.left = `${startRect.left}px`;
			flyingDisk.style.top = `${startRect.top}px`;
			document.body.appendChild(flyingDisk);

			let currentTargetTower = null;

			const onPointerMove = (moveEvent) => {
				flyingDisk.style.left = `${moveEvent.clientX - offsetX}px`;
				flyingDisk.style.top = `${moveEvent.clientY - offsetY}px`;

				flyingDisk.style.display = 'none';
				const elementUnderCursor = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
				flyingDisk.style.display = '';

				const towerEl = elementUnderCursor ? elementUnderCursor.closest('.tower') : null;
				if (towerEl !== currentTargetTower) {
					this.clearHoverStates();
					currentTargetTower = towerEl;
					
					if (towerEl) {
						const toTowerIdx = Number(towerEl.dataset.tower);
						const targetTopDiskSize = this.towers[toTowerIdx][this.towers[toTowerIdx].length - 1];
						const isValidMove = targetTopDiskSize === undefined || diskSize < targetTopDiskSize;
						
						towerEl.classList.add(isValidMove ? 'is-hover-valid' : 'is-hover-invalid');
					}
				}
			};

			const onPointerUp = () => {
				document.removeEventListener('pointermove', onPointerMove);
				document.removeEventListener('pointerup', onPointerUp);
				
				flyingDisk.remove();
				this.clearHoverStates();
				diskEl.classList.remove('is-ghost');

				if (currentTargetTower) {
					const toTowerIdx = Number(currentTargetTower.dataset.tower);
					this.attemptMove(fromTowerIdx, toTowerIdx, diskSize);
				}
			};

			document.addEventListener('pointermove', onPointerMove);
			document.addEventListener('pointerup', onPointerUp);
		});
	}

	clearHoverStates() {
		this.dom.towerEls.forEach(tower => {
			tower.classList.remove('is-hover-valid', 'is-hover-invalid');
		});
	}

	attemptMove(fromTowerIdx, toTowerIdx, diskSize) {
		if (fromTowerIdx === toTowerIdx) return;

		const destinationStack = this.towers[toTowerIdx];
		const topDestinationDiskSize = destinationStack[destinationStack.length - 1];

		if (topDestinationDiskSize !== undefined && diskSize > topDestinationDiskSize) {
			this.dom.riteNote.textContent = 'The heavier ring resists. It cannot rest upon a lesser one.';
			return;
		}

		this.towers[fromTowerIdx].pop();
		destinationStack.push(diskSize);
		
		this.moves++;
		this.dom.moveCountEl.textContent = String(this.moves);
		
		this.render();

		if (!this.checkWinCondition()) {
			this.dom.riteNote.textContent = 'Drag the topmost ring of a tower to move it.';
		}
	}

	checkWinCondition() {
		if (this.towers[2].length === this.diskCount) {
			this.isComplete = true;
			this.dom.riteNote.textContent = '✦ The rite is complete. The last seal is broken. ✦';
			this.dom.riteNote.classList.add('is-complete');
			this.render();
			return true;
		}
		return false;
	}
}

document.addEventListener('DOMContentLoaded', () => {
	new TowerOfHanoi();
});