import React from 'react';
import { TouchableOpacity, Text as RNText, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSizes, Spacing } from '../theme';

interface Props {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'outline';
    style?: ViewStyle;
    disabled?: boolean; // <-- added
}

const Button: React.FC<Props> = ({ title, onPress, variant = 'primary', style, disabled = false }) => {
    return (
        <TouchableOpacity
            style={[
                styles.base,
                variant === 'primary' ? styles.primary : styles.outline,
                style,
                disabled && styles.disabled, // apply disabled style
            ]}
            onPress={disabled ? undefined : onPress} // disable press
            activeOpacity={0.7}
        >
            <RNText
                style={[
                    styles.text,
                    variant === 'outline' && { color: Colors.text },
                    disabled && styles.textDisabled, // change text color if disabled
                ]}
            >
                {title}
            </RNText>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        width: '85%',
        paddingVertical: Spacing.md,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    primary: {
        backgroundColor: Colors.primary,
    },
    outline: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    text: {
        fontSize: FontSizes.subtitle,
        fontWeight: '600',
        color: Colors.background,
    },
    disabled: {
        opacity: 0.5, // make the button look disabled
    },
    textDisabled: {
        color: '#aaa', // optional: gray text when disabled
    },
});

export default Button;
