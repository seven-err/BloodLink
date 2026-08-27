import { Platform, TextStyle } from 'react-native';

export const fontFamilies = {
  // SF Pro Text (Optimal for <= 20pt, UI elements, body, buttons, inputs)
  textRegular: Platform.select({
    ios: 'SF Pro Text',
    android: 'SFProText-Regular',
    default: 'SFProText-Regular, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
  }) as string,
  textMedium: Platform.select({
    ios: 'SF Pro Text',
    android: 'SFProText-Medium',
    default: 'SFProText-Medium, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
  }) as string,
  textSemibold: Platform.select({
    ios: 'SF Pro Text',
    android: 'SFProText-Semibold',
    default: 'SFProText-Semibold, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
  }) as string,
  textBold: Platform.select({
    ios: 'SF Pro Text',
    android: 'SFProText-Bold',
    default: 'SFProText-Bold, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
  }) as string,
  textHeavy: Platform.select({
    ios: 'SF Pro Text',
    android: 'SFProText-Heavy',
    default: 'SFProText-Heavy, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
  }) as string,
  textItalic: Platform.select({
    ios: 'SF Pro Text',
    android: 'SFProText-Italic',
    default: 'SFProText-Italic, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
  }) as string,

  // SF Pro Display (Optimal for >= 20pt, headings, large titles, banners)
  displayRegular: Platform.select({
    ios: 'SF Pro Display',
    android: 'SFProDisplay-Regular',
    default: 'SFProDisplay-Regular, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
  }) as string,
  displayMedium: Platform.select({
    ios: 'SF Pro Display',
    android: 'SFProDisplay-Medium',
    default: 'SFProDisplay-Medium, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
  }) as string,
  displaySemibold: Platform.select({
    ios: 'SF Pro Display',
    android: 'SFProDisplay-Semibold',
    default: 'SFProDisplay-Semibold, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
  }) as string,
  displayBold: Platform.select({
    ios: 'SF Pro Display',
    android: 'SFProDisplay-Bold',
    default: 'SFProDisplay-Bold, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
  }) as string,
  displayHeavy: Platform.select({
    ios: 'SF Pro Display',
    android: 'SFProDisplay-Heavy',
    default: 'SFProDisplay-Heavy, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
  }) as string,
} as const;

export const typography = {
  fonts: fontFamilies,
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
  },
  styles: {
    displayHero: {
      fontFamily: fontFamilies.displayBold,
      fontSize: 34,
      lineHeight: 41,
      letterSpacing: 0.37,
      fontWeight: '700',
    } as TextStyle,
    displayLarge: {
      fontFamily: fontFamilies.displayBold,
      fontSize: 28,
      lineHeight: 34,
      letterSpacing: 0.36,
      fontWeight: '700',
    } as TextStyle,
    title1: {
      fontFamily: fontFamilies.displaySemibold,
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: 0.35,
      fontWeight: '600',
    } as TextStyle,
    title2: {
      fontFamily: fontFamilies.displaySemibold,
      fontSize: 20,
      lineHeight: 25,
      letterSpacing: 0.38,
      fontWeight: '600',
    } as TextStyle,
    title3: {
      fontFamily: fontFamilies.textSemibold,
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.41,
      fontWeight: '600',
    } as TextStyle,
    headline: {
      fontFamily: fontFamilies.textSemibold,
      fontSize: 16,
      lineHeight: 21,
      letterSpacing: -0.32,
      fontWeight: '600',
    } as TextStyle,
    body: {
      fontFamily: fontFamilies.textRegular,
      fontSize: 15,
      lineHeight: 20,
      letterSpacing: -0.24,
      fontWeight: '400',
    } as TextStyle,
    bodyMedium: {
      fontFamily: fontFamilies.textMedium,
      fontSize: 15,
      lineHeight: 20,
      letterSpacing: -0.24,
      fontWeight: '500',
    } as TextStyle,
    bodySemibold: {
      fontFamily: fontFamilies.textSemibold,
      fontSize: 15,
      lineHeight: 20,
      letterSpacing: -0.24,
      fontWeight: '600',
    } as TextStyle,
    callout: {
      fontFamily: fontFamilies.textRegular,
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: -0.15,
      fontWeight: '400',
    } as TextStyle,
    subheadline: {
      fontFamily: fontFamilies.textRegular,
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: -0.08,
      fontWeight: '400',
    } as TextStyle,
    subheadlineMedium: {
      fontFamily: fontFamilies.textMedium,
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: -0.08,
      fontWeight: '500',
    } as TextStyle,
    footnote: {
      fontFamily: fontFamilies.textRegular,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0,
      fontWeight: '400',
    } as TextStyle,
    caption1: {
      fontFamily: fontFamilies.textMedium,
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.07,
      fontWeight: '500',
    } as TextStyle,
    caption2: {
      fontFamily: fontFamilies.textSemibold,
      fontSize: 10,
      lineHeight: 13,
      letterSpacing: 0.12,
      fontWeight: '600',
    } as TextStyle,
    button: {
      fontFamily: fontFamilies.textSemibold,
      fontSize: 15,
      lineHeight: 20,
      letterSpacing: -0.24,
      fontWeight: '600',
    } as TextStyle,
  },
} as const;
