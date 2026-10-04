import React,{forwardRef} from 'react';
import {Text,TextInput} from 'react-native';
import {typeStyles,typeLimits,control,space} from '../../theme/layout';

export const AppText=forwardRef(function AppText({variant='body',style,...props},ref){
 return <Text ref={ref} accessibilityRole={['section','title','page'].includes(variant)?'header':undefined} allowFontScaling maxFontSizeMultiplier={typeLimits[variant]} {...props} style={[typeStyles[variant],style]} />;
});
export const AppTextInput=forwardRef(function AppTextInput({style,multiline,...props},ref){
 return <TextInput ref={ref} allowFontScaling maxFontSizeMultiplier={0} multiline={multiline} {...props}
  style={[typeStyles.body,{minHeight:control.minTarget,paddingVertical:space.md},multiline&&{textAlignVertical:'top'},style]} />;
});
