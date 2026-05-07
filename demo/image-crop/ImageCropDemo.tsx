import React, { useCallback } from 'react';
import { NavigationProps, withNavigationItem } from 'hybrid-navigation';
import { launchImageLibrary } from 'react-native-image-picker';
import { useToast } from 'react-native-toast-hybrid';
import { ObjectRect } from '@sdcx/image-crop';
import RNFS from 'react-native-fs';
import { DemoItem, DemoList, demoTheme } from '../components/DemoKit';
const qs = require('qs');

interface Item extends DemoItem {
	title: string;
	id: 'avatar' | 'photo' | 'detect';
}

const data: Array<Item> = [
	{
		id: 'avatar',
		title: '头像裁剪（圆形）',
		subtitle: '圆形裁剪区域',
		accentColor: demoTheme.colors.rose,
	},
	{
		id: 'photo',
		title: '照片裁剪（矩形）',
		subtitle: '自由矩形裁剪区域',
		accentColor: demoTheme.colors.indigo,
	},
	{
		id: 'detect',
		title: '照片裁剪（矩形 + 图像主体检测）',
		subtitle: '主体检测结果带入裁剪页',
		accentColor: demoTheme.colors.green,
	},
];

function ImageCropDemo({ navigator }: NavigationProps) {
	const toast = useToast();

	const getAccessToken = useCallback(async () => {
		const client_id = '4G5y6AkjXjOBrYN1xl6hiCGt';
		const client_secret = 'vxhUyS18CQb2EZ0QGsDGHiw0qFm5U0g2';
		const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${client_id}&client_secret=${client_secret}`;
		const result = await (await fetch(url, { method: 'GET' })).json();
		return result.access_token;
	}, []);

	const detectObject = useCallback(
		async (uri: string) => {
			toast.loading('图片检测中...');
			try {
				const accessToken = await getAccessToken();
				const imageBase64 = await RNFS.readFile(uri, 'base64');
				const url = `https://aip.baidubce.com/rest/2.0/image-classify/v1/object_detect?access_token=${accessToken}`;

				const result = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					body: qs.stringify({ image: imageBase64, with_face: 1 }),
				});
				const objectRect: ObjectRect = (await result.json()).result;

				console.log('图像检测结果：' + JSON.stringify(objectRect));
				toast.hide();
				await navigator.push('ImageCropPage', { fileUri: uri, objectRect: objectRect });
			} catch (e: any) {
				toast.text('图片检测失败' + e.message);
			}
		},
		[getAccessToken, navigator, toast],
	);

	const handlePhotoDetectPress = useCallback(async () => {
		const result = await launchImageLibrary({
			selectionLimit: 1,
			mediaType: 'photo',
		});
		console.log('选择照片结果：', JSON.stringify(result));

		if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
			await detectObject(result.assets[0].uri);
		}
	}, [detectObject]);

	const handlePhotoPress = useCallback(async () => {
		const result = await launchImageLibrary({
			selectionLimit: 1,
			mediaType: 'photo',
		});
		console.log('选择照片结果：', JSON.stringify(result));

		if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
			await navigator.push('ImageCropPage', { fileUri: result.assets[0].uri });
		}
	}, [navigator]);

	const handleHeadPhotoPress = useCallback(async () => {
		const result = await launchImageLibrary({
			selectionLimit: 1,
			mediaType: 'photo',
		});
		console.log('选择照片结果：', JSON.stringify(result));
		if (result.assets && result.assets.length > 0 && result.assets[0].uri) {
			await navigator.push('ImageCropPage', {
				fileUri: result.assets[0].uri,
				cropStyle: 'circular',
			});
		}
	}, [navigator]);

	return (
		<DemoList
			title="Image Crop"
			subtitle="图片选择、裁剪与检测流程"
			eyebrow="Media"
			data={data}
			accentColor={demoTheme.colors.rose}
			onItemPress={item => {
				if (item.id === 'avatar') {
					handleHeadPhotoPress();
				} else if (item.id === 'photo') {
					handlePhotoPress();
				} else {
					handlePhotoDetectPress();
				}
			}}
		/>
	);
}

export default withNavigationItem({})(ImageCropDemo);
