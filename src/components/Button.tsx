import React from 'react';
import { TouchableOpacity, Text as RNText, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, FontSizes, Spacing } from '../theme';

interface Props {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'outline' | 'ghost';
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
}

const Button: React.FC<Props> = ({ title, onPress, variant = 'primary', style, disabled = false, textStyle }) => {
    const isOutline = variant === 'outline';
    const isGhost = variant === 'ghost';

    return (
        <TouchableOpacity
            style={[
                styles.base,
                isOutline && styles.outline,
                isGhost && styles.ghost,
                !isOutline && !isGhost && styles.primary,
                disabled && styles.disabled,
                style,
            ]}
            onPress={disabled ? undefined : onPress}
            activeOpacity={0.8}
        >
            <RNText
                style={[
                    styles.text,
                    isOutline && { color: Colors.text },
                    isGhost && { color: Colors.mutedText },
                    !isOutline && !isGhost && { color: '#000' },
                    disabled && styles.textDisabled,
                    textStyle,
                ]}
            >
                {title}
            </RNText>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        width: '100%',
        paddingVertical: Spacing.md,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primary: {
        backgroundColor: Colors.primaryButtonColor,
    },
    outline: {
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: 'transparent',
    },
    ghost: {
        backgroundColor: 'transparent',
    },
    text: {
        fontSize: FontSizes.subtitle,
        fontWeight: '600',
    },
    disabled: {
        opacity: 0.5,
    },
    textDisabled: {
        color: Colors.mutedText,
    },
});

export default Button;
