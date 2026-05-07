import { StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import React, { useState } from 'react';

import MessageType from './models/MessageType';
import initialMessages from './data/messages';
import TextInputBar from './TextInputBar';
import userName from './userName';
import MessageItem from './MessageItem';
import Message from './models/Message';
import { KeyboardInsetsView } from '@sdcx/keyboard-insets';

const Messages = () => {
	const [messages, setMessages] = useState([...initialMessages].reverse());

	const appendMessage = (text: string) => {
		const message = {
			id: Math.floor(Math.random() * 1000000).toString(),
			text,
			sender: userName,
			type: MessageType.Text,
		} as Message;
		setMessages([...messages, message]);
	};

	return (
		<KeyboardInsetsView style={styles.keyboardAvoidingViewStyles} extraHeight={8}>
			<FlashList
				style={styles.list}
				nestedScrollEnabled
				renderItem={MessageItem}
				keyExtractor={item => {
					return item.id;
				}}
				getItemType={item => {
					return item.type;
				}}
				maintainVisibleContentPosition={{
					startRenderingFromBottom: true,
					autoscrollToBottomThreshold: 0.2,
				}}
				data={messages}
			/>
			<TextInputBar
				onSend={text => {
					appendMessage(text);
				}}
			/>
		</KeyboardInsetsView>
	);
};

const styles = StyleSheet.create({
	keyboardAvoidingViewStyles: {
		flex: 1,
		backgroundColor: 'white',
	},
	list: {
		flex: 1,
	},
});

export default Messages;
