import { Platform } from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';

/** 翻页轻震：沿用 iOS selection / Android clockTick 的原生刻度反馈。 */
export function hapticTick() {
    HapticFeedback.trigger(Platform.OS === 'ios' ? 'selection' : 'clockTick');
}
