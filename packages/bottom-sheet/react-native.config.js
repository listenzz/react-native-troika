module.exports = {
	dependency: {
		platforms: {
			android: {
				libraryName: 'bottomsheet',
				componentDescriptors: ['BottomSheetContentViewComponentDescriptor'],
				cmakeListsPath: 'src/main/jni/CMakeLists.txt',
			},
		},
	},
};
