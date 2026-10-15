import React from 'react';
import {View,Pressable,StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {SelectionControl,useAdaptiveLayout} from '../ui/AdaptiveControls';
import {AppText} from '../ui/AppText';
import {space,radius,control} from '../../theme/layout';

// Sibling controls keep selection, opening and sharing independently reachable.
export function FormSelectionRow({form,colors,onSelect,onOpen,onShare}) {
 const {stack}=useAdaptiveLayout();
 const complete=form.status==='complete';
 const status=complete?'Complete':'Incomplete';
 return <View style={[styles.row,{backgroundColor:colors.surface,borderColor:colors.border},stack&&styles.stacked]}>
  <SelectionControl compact={!stack} colors={colors} label={`Select ${form.name}`} checked={!!form.selected} onPress={onSelect}/>
  <Pressable accessibilityRole="button" accessibilityLabel={`Open ${form.name}. ${status}`} accessibilityHint={form.desc} onPress={onOpen}
   style={[styles.open,stack&&styles.fullWidth]}>
   <AppText variant="label" style={{color:colors.textPrimary}}>{form.name}</AppText>
   <AppText variant="secondary" style={{color:colors.textSecondary}}>{form.desc}</AppText>
   <AppText variant="secondary" style={{color:colors.textSecondary}}>{status}</AppText>
  </Pressable>
  {complete&&<Pressable accessibilityRole="button" accessibilityLabel={`Share ${form.name}`} onPress={onShare} style={[styles.share,stack&&styles.fullWidth]}>
   <Ionicons accessible={false} name="share-outline" size={control.icon} color={colors.accent}/>
   {stack&&<AppText variant="label" style={{color:colors.accent,flexShrink:1}}>Share form</AppText>}
  </Pressable>}
 </View>;
}
const styles=StyleSheet.create({
 row:{flexDirection:'row',alignItems:'center',borderWidth:control.border,borderRadius:radius.control,padding:space.md,gap:space.sm,marginBottom:space.md},
 stacked:{flexDirection:'column',alignItems:'stretch'},
 open:{flex:1,minWidth:0,minHeight:control.minTarget,justifyContent:'center',gap:space.xs,paddingVertical:space.sm},
 share:{minWidth:control.minTarget,minHeight:control.minTarget,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:space.sm,padding:space.sm},
 fullWidth:{width:'100%',flex:undefined},
});
