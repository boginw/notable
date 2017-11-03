import { Modal, Confirm } from '../Modal/Modal';

export default class LicenceAgree {

	private agreeText = `<h1>Terms of service</h1>
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec eget semper massa. \
Fusce pellentesque, magna et commodo volutpat, leo massa vestibulum magna, non con\
vallis quam massa convallis enim. Etiam ac sollicitudin tellus, id pretium felis. \
Vestibulum condimentum, urna at feugiat pulvinar, est lectus ullamcorper lectus, a\
 efficitur nulla tortor ut arcu. Suspendisse mi ipsum, maximus commodo leo nec, bi\
 bendum pellentesque lorem. Proin tristique sem non pretium dapibus. Morbi posuere\
 lobortis arcu eu tempus. Nunc malesuada quam tincidunt tortor iaculis tincidunt. \
 Nullam ut lacinia lectus, non mattis ipsum. Vivamus egestas imperdiet dolor ut ul\
 tricies.<br />Praesent pretium sem vel ipsum tempus, a malesuada massa faucibus. \
 Nunc at tortor vitae mi consequat blandit in commodo nunc. Morbi a turpis luctus,\
 cursus elit id, commodo mauris. Aenean dui leo, placerat eu posuere in, facilisis\
 nec magna. Morbi eget vehicula dolor, a iaculis leo. Phasellus eleifend varius me\
 tus. Maecenas dictum, est et bibendum tempor, mi felis volutpat diam, vitae posue\
 re tellus tellus eget velit. Duis ultrices, quam sed ultrices ultricies, risus ma\
 uris cursus ipsum, eu maximus dolor nibh sit amet tortor. Cras quis erat nec nisl\
 elementum ullamcorper. Integer ac mauris nibh. Aliquam at nisi id nunc sollicitud\
 in blandit et quis augue. Mauris iaculis, metus ut suscipit sollicitudin, dolor n\
 ibh tincidunt orci, id faucibus dui tellus ut ipsum. In hac habitasse platea dict\
 umst. Nunc quis mauris pretium, vestibulum justo id, finibus ante. Sed eleifend n\
 ibh quis erat facilisis, condimentum sollicitudin sapien rutrum. Quisque pharetra\
nunc quis quam tristique, ut pulvinar nunc pulvinar.<br />Integer varius elit non \
ex facilisis accumsan. Praesent ultricies felis sed tortor lacinia feugiat. Intege\
r sit amet justo et tellus blandit fringilla. Cras vel nisl ut libero finibus port\
titor. Maecenas quis lorem dictum arcu aliquet ullamcorper. Fusce sit amet diam co\
nvallis, dignissim tortor id, viverra ante. Etiam blandit ornare lacinia. Praesent\
vitae odio augue. Nulla libero nunc, semper sit amet nisi vitae, condimentum vehic\
ula elit. Nam laoreet nulla et nunc egestas, sed ultricies sem consectetur. Morbi \
sit amet imperdiet lacus, maximus ultricies risus. Class aptent taciti sociosqu ad\
 litora torquent per conubia nostra, per inceptos himenaeos. Donec hendrerit mauri\
 s eu aliquet mattis.<br />Nullam pharetra arcu sed tellus sollicitudin rutrum. Do\
 nec accumsan, nibh ut pulvinar viverra, ex ipsum scelerisque turpis, vel pharetra\
 urna mi quis purus. Quisque ornare non nunc laoreet porta. Nulla sit amet lacinia\
 sapien, nec congue nisi. Vestibulum vehicula eleifend orci, in placerat ante auct\
or quis. Donec nec tincidunt velit. Phasellus molestie tempus eros vel pretium. Na\
m mattis nisl nec est aliquet, vel bibendum sem maximus. Vestibulum viverra, turpi\
s vitae lacinia mollis, magna ipsum iaculis mauris, et porta augue nisl eleifend a\
nte.<br />Maecenas blandit tellus metus, sed feugiat quam commodo vitae. Vestibulu\
m molestie pulvinar justo, eget dapibus sem dignissim eget. Fusce gravida egestas \
tincidunt. Vivamus iaculis eleifend nisi vitae ultrices. Vestibulum orci felis, su\
scipit eget neque at, fermentum dignissim dolor. Curabitur leo velit, mattis ut do\
lor et, semper laoreet purus. Sed volutpat eleifend tortor.`;

	constructor(callback: (...any) => any) {
		let modal;
		let agreeDom: HTMLDivElement = this.renderAgreeDom(this.agreeText, () => {
			modal.close();
			callback();
		});

		modal = new Modal(agreeDom, "Login", true);
		modal.show();
	}


	private renderAgreeDom(agreeText: string, callback: (...any) => any): HTMLDivElement {
		let base: HTMLDivElement = document.createElement('div');

		base.innerHTML = `<div class="login-agreement">${agreeText}</div>`;

		let checker = document.createElement('input');
		checker.type = 'checkbox';
		checker.id = 'i-agree';
		checker.onchange = (ev) => {
			button.disabled = !checker.checked;
		};
		base.appendChild(checker);

		let checkerText = document.createElement('label');
		checkerText.setAttribute('for', 'i-agree');
		checkerText.innerText = "I have read and agree to the terms and conditions";
		base.appendChild(checkerText);

		let buttonContainer = document.createElement('div');
		buttonContainer.className = "button-container";

		let button = this.renderButton("Continue", callback);
		button.disabled = true;

		buttonContainer.appendChild(button);

		base.appendChild(buttonContainer);

		return base;
	}

	private renderButton(title: string, action: (...any) => any): HTMLButtonElement {
		let button: HTMLButtonElement = document.createElement('button');
		button.innerText = title;

		button.onclick = action;

		return button;
	}
}