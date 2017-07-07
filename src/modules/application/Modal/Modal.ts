import Events from '../Events/Events';

export default class Modal {
	private modal: HTMLDivElement;
	private click: (event: MouseEvent)=> void;
	private clickOutsideClose: boolean = true;

	/**
	 * Default constructor
	 * @param {HTMLElement} contents Contents of the modal 
	 * @param {string} title The modal title
	 */
	constructor(contents: HTMLElement, title: string, private hasCloseButton: boolean = true) {
		// Render the modal
		this.modal = this.renderModal(title, contents);

		// Add modal to body
		document.body.appendChild(this.modal);
	}

	/**
	 * Shows the modal
	 */
	public show(): void {
		Events.trigger('modal.show');
		
		if(this.modal){
			this.modal.style.display = "flex";			
		}
	}

	/**
	 * Hides the modal
	 */
	public hide(): void{
		Events.trigger('modal.hide');
		
		if(this.modal){
			this.modal.style.display = "none";
		}
	}

	/**
	 * Closes the modal
	 */
	public close(): void {
		Events.trigger('modal.close');	

		if(this.modal){
			this.hide();
			this.modal.remove();
		}
	}

	/**
	 * Renders the complete modal
	 * @param title Title of the modal
	 * @param body Body of the modal
	 * @return the modal element
	 */
	private renderModal(title: string, body: HTMLElement): HTMLDivElement{
		// Create the modal container
		let base: HTMLDivElement = document.createElement('div');
		base.className = 'modal';

		base.onclick = (event: MouseEvent)=>{
			if (this.clickOutsideClose && this.modal && this.modal == event.target) {
				this.close();
			}
		};

		// Modal contents
		let modalContents: HTMLDivElement = document.createElement('div');
		modalContents.className = "modal-content";

		modalContents.appendChild(this.renderHeader(title));
		modalContents.appendChild(this.renderBody(body));

		// Append to modal container
		base.appendChild(modalContents);

		return base;
	}

	/**
	 * Renders the body of the modal
	 * @param contents Contents of the modal
	 * @return Rendered version of the modal contents
	 */
	private renderBody(contents: HTMLElement): HTMLDivElement{
		let body: HTMLDivElement = document.createElement('div');
		body.className = 'modal-body';
		body.appendChild(contents);

		return body;
	}

	/**
	 * Renders the header of the modal
	 * @param titleText Modal title text
	 * @return Rendered version of the modal header
	 */
	private renderHeader(titleText: string): HTMLDivElement{
		let header: HTMLDivElement = document.createElement('div');
		header.className = 'modal-header';

		if(this.hasCloseButton){
			let close: HTMLSpanElement = document.createElement('span');
			close.className = 'modal-close';
			close.innerHTML = '&times;';
			header.appendChild(close);
	
			// If we click to close the modal
			close.onclick = ()=>{
				this.close();
			};
		}
		
		
		let title: HTMLHeadingElement = document.createElement('h3');
		title.innerHTML = titleText;

		header.appendChild(title);

		return header;
	}
}