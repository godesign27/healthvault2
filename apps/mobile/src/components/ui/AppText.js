import React,{forwardRef,useState} from 'react';
import {Pressable,Text,TextInput} from 'react-native';
import {typeStyles,typeLimits,control,space} from '../../theme/layout';

export const AppText=forwardRef(function AppText({variant='body',style,...props},ref){
 return <Text ref={ref} accessibilityRole={['section','title','page'].includes(variant)?'header':undefined} allowFontScaling maxFontSizeMultiplier={typeLimits[variant]} {...props} style={[typeStyles[variant],style]} />;
});

export function RevealText({variant='body',style,numberOfLines,children,...props}){
 const text=typeof children==='string'?children:'';
 const [open,setOpen]=useState(false);
 const limited=Number.isFinite(numberOfLines)&&numberOfLines>0&&text.length>0;
 function toggle(){if(limited)setOpen((value)=>!value);}
 const body=<AppText variant={variant} style={style} numberOfLines={open?undefined:numberOfLines} accessible={false} {...props}>{children}</AppText>;
 if(!limited)return body;
 return <Pressable onPress={toggle} accessibilityRole="button" accessibilityState={{expanded:open}} accessibilityHint={open?undefined:'Shows the full text'} accessibilityLabel={text}>{body}</Pressable>;
}
export const AppTextInput=forwardRef(function AppTextInput({style,multiline,...props},ref){
 return <TextInput ref={ref} allowFontScaling maxFontSizeMultiplier={0} multiline={multiline} {...props}
  style={[typeStyles.body,{minHeight:control.minTarget,paddingVertical:space.md},multiline&&{textAlignVertical:'top'},style]} />;
});
