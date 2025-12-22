import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { Colors, FontSizes } from '../theme';

interface Props extends TextProps {
  variant?: 'title' | 'subtitle' | 'caption';
  color?: keyof typeof Colors;
}

const Text: React.FC<Props> = ({
  variant = 'body',
  color = 'text',
  style,
  children,
  ...rest
}) => {
  const fontSize = {
    title: FontSizes.title,
    subtitle: FontSizes.subtitle,
    caption: FontSizes.caption,
  }[variant];

  return (
    <RNText
      style={[
        styles.base,
        { fontSize, color: Colors[color] },
        variant === 'title' && styles.title,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  base: {
    color: Colors.text,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Text;
