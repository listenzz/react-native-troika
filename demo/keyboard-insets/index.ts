import Navigation from 'hybrid-navigation';

import Home from './Home';
import KeyboardAvoiding from './KeyboardAvoiding';
import KeyboardChat from './KeyboardChat';
import KeyboardChatReanimated from './KeyboardChatReanimated';
import ModalTextInput from './ModalTextInput';
import TouchOffsetTest from './TouchOffsetTest';

export function registerKeyboardComponent() {
	Navigation.registerComponent('Keyboard', () => Home);
	Navigation.registerComponent('KeyboardAvoiding', () => KeyboardAvoiding);
	Navigation.registerComponent('KeyboardChat', () => KeyboardChat);
	Navigation.registerComponent('KeyboardChatReanimated', () => KeyboardChatReanimated);
	Navigation.registerComponent('ModalTextInput', () => ModalTextInput);
	Navigation.registerComponent('TouchOffsetTest', () => TouchOffsetTest);
}
