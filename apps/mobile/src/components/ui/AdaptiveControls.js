import React from 'react';
import {View,Pressable,useWindowDimensions,StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {AppText,AppTextInput} from './AppText';
import {space,radius,control,adaptiveLayout} from '../../theme/layout';
export function useAdaptiveLayout(){const {width,fontScale}=useWindowDimensions();return adaptiveLayout(width,fontScale);}
export function AppButton({colors,label,onPress,disabled=false,busy=false,primary=false,tone,style}){
 const unavailable=disabled||busy;
 const fill=tone==='success'?(colors.successAction||colors.navy):tone==='danger'?(colors.dangerAction||colors.navy):colors.navy;
 return <Pressable accessibilityRole="button" accessibilityState={{disabled:unavailable,busy}} disabled={unavailable} onPress={onPress}
  style={({pressed})=>[styles.action,{backgroundColor:primary?fill:colors.surface,borderColor:primary?fill:(colors.controlBorder||colors.border),opacity:unavailable ? 0.5 : pressed ? 0.8 : 1},style]}>
  <AppText variant="label" style={{textAlign:'center',flexShrink:1,color:primary?colors.onAction:colors.textPrimary}}>{label}</AppText>
 </Pressable>;
}
export function SelectionControl({colors,label,description,checked,onPress,disabled=false,kind='checkbox',compact=false}){
 return <Pressable accessibilityRole={kind} accessibilityLabel={label} accessibilityHint={description} accessibilityState={{checked,disabled}} disabled={disabled} onPress={onPress}
  style={[styles.selection,compact?styles.compact:{borderWidth:control.border,borderColor:checked?colors.accent:(colors.controlBorder||colors.border),backgroundColor:checked?colors.accentBg:colors.surface},disabled&&{opacity:.5}]}>
  <Ionicons accessible={false} name={kind==='radio'?(checked?'radio-button-on':'radio-button-off'):(checked?'checkbox':'square-outline')} size={control.icon} color={checked?colors.accent:colors.textSecondary}/>
  {!compact&&<View style={{flex:1,minWidth:0}}><AppText variant="label" style={{color:colors.textPrimary}}>{label}</AppText>{!!description&&<AppText variant="secondary" style={{color:colors.textSecondary}}>{description}</AppText>}</View>}
 </Pressable>;
}
export function DisclosureButton({colors,label,expanded,onPress}){
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{expanded}} onPress={onPress} style={styles.selection}>
  <AppText variant="label" style={{flex:1,color:colors.accent}}>{label}</AppText>
  <Ionicons accessible={false} name={expanded?'chevron-up':'chevron-down'} size={control.icon} color={colors.accent}/>
 </Pressable>;
}
export function AppField({colors,label,hint,error,...props}){
 return <View style={{gap:space.sm}}><AppText variant="label" style={{color:colors.textPrimary}}>{label}</AppText>
 <AppTextInput accessibilityLabel={label} accessibilityHint={error||hint} placeholderTextColor={colors.textSecondary} {...props} style={[styles.field,{color:colors.textPrimary,borderColor:error?colors.danger:(colors.controlBorder||colors.border),backgroundColor:colors.surface},props.style]}/>
 {!!(error||hint)&&<AppText variant="secondary" accessibilityLiveRegion="polite" style={{color:error?colors.danger:colors.textSecondary}}>{error||hint}</AppText>}</View>;
}
const styles=StyleSheet.create({
 action:{paddingHorizontal:space.lg,paddingVertical:space.md,borderRadius:radius.control,minHeight:control.minTarget,borderWidth:control.border,justifyContent:'center',alignItems:'center',maxWidth:'100%'},
 selection:{flexDirection:'row',alignItems:'center',gap:space.md,padding:space.md,minHeight:control.minTarget,borderRadius:radius.control},
 compact:{width:control.minTarget,height:control.minTarget,padding:space.md},
 field:{borderWidth:control.border,borderRadius:radius.control,paddingHorizontal:space.md},
});
