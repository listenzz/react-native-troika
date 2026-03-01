module.exports = {
	dependency: {
		platforms: {
			android: {
				libraryName: 'keyboardinsets',
				componentDescriptors: ['KeyboardInsetsViewComponentDescriptor'],
				cmakeListsPath: 'src/main/jni/CMakeLists.txt',
			},
		},
	},
};
