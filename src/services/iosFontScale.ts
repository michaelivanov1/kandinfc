import { Platform, PixelRatio } from 'react-native';

const IOS_FONT_SCALE = 1.; // scale factor for iOS font sizing

export const iosFontScale = (size: number) => {
    const scaled = Platform.OS === 'ios' ? size * IOS_FONT_SCALE : size;
    return Math.round(PixelRatio.roundToNearestPixel(scaled));
};