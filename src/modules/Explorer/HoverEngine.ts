import Events from "../Events/Events";

export default class HoverEngine {
	private root: HTMLUListElement;
	private index: number;
	private active: boolean;

	constructor(root: HTMLUListElement,
			private hoverClass: string = "hover",
			private openClass: string = "open"){
		this.root = root;
	}

	public attach(): void {
		this.active = true;
		this.index = this.findOpen();
	
		document.addEventListener("keydown", this.contextRerouter);

		Events.on('explorer.open', () => {
			if(this.active){
				setTimeout(()=>{
					this.index = this.findOpen();
				}, 50);
			}
		});
	}

	public detatch(): void {
		this.active = false;
		if(this.root){
			let children = this.root.children;
			for (let i = 0; i < children.length; i++) {
				children[i].classList.remove("hover");
			}
		}

		document.removeEventListener("keydown", this.contextRerouter);
	}

	// Needed in order to keep context
	private contextRerouter = (e:KeyboardEvent) => {
		this.keyPress(e);
	}

	private findOpen(): number{
		let children: HTMLCollection = this.root.children;

		for(let i = 0; i < children.length; i++){
			// is the file open
			if(children[i].className.indexOf("open") != -1){
				return i;
			}
		}

		return NaN;
	}

	private keyPress(e:KeyboardEvent): void{
		switch (e.key) {
			case 'ArrowUp':
				this.arrowMove(true);
				break;
			case 'ArrowDown':
				this.arrowMove(false);
				break;
			case 'Enter':
				this.action();
				break;
			case 'Backspace':
				Events.trigger("navigator.up");
				break;
		}
	}

	private action(): void{
		let activeElement: Element = this.root.children[this.index];
		if(activeElement != undefined){
			activeElement.dispatchEvent(new Event("click"));
		}
	}

	private arrowMove(upDown: boolean): void{
		if(this.root && this.index != NaN && this.root.children.length > this.index){
			this.root.children[this.index].classList.remove("hover");
		}
		
		if(upDown){
			if(this.index > 0){
				this.index--;
			}
		} else if(!upDown){
			if(this.index < this.root.children.length - 1){
				this.index++;
			}
		}

		if(this.root.children[this.index]){
			this.root.children[this.index].classList.add("hover");
		}else{
			this.index = 0;
		}
	}
}