import {FormSelectionRow} from '../src/components/forms/FormSelectionRow';
// Synthetic component acceptance. Not part of the normal application entry.
import React,{useState} from 'react';
import {AppRegistry,ScrollView,View} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {AppText} from '../src/components/ui/AppText';
import {AppButton,AppField,SelectionControl,DisclosureButton,useAdaptiveLayout} from '../src/components/ui/AdaptiveControls';
import {recordsColors} from '../src/theme/records';
import {space} from '../src/theme/layout';
function Harness(){
 const [formSelected,setFormSelected]=useState(false),[formAction,setFormAction]=useState('No form action yet');
 const [dark,setDark]=useState(false),[checked,setChecked]=useState(false),[expanded,setExpanded]=useState(false),[value,setValue]=useState(''),[saved,setSaved]=useState(false);
 const colors=recordsColors(dark),layout=useAdaptiveLayout();
 return <SafeAreaProvider><SafeAreaView style={{flex:1,backgroundColor:dark?colors.canvas:colors.surface}}><ScrollView contentContainerStyle={{padding:layout.gutter,gap:space.lg}} keyboardShouldPersistTaps="handled">
 <AppText variant="page" style={{color:colors.textPrimary}}>Your records</AppText>
 <AppText style={{color:colors.textSecondary}}>Review your information before saving. Text and controls adapt to your reading preferences.</AppText>
 <AppButton colors={colors} label={dark?'Use light appearance':'Use dark appearance'} onPress={()=>setDark(x=>!x)}/>
 <FormSelectionRow colors={colors} form={{name:'Patient registration',desc:'Synthetic form for control testing',status:'complete',selected:formSelected}} onSelect={()=>{setFormSelected(x=>!x);setFormAction('Selection changed only');}} onOpen={()=>setFormAction('Open form only')} onShare={()=>setFormAction('Share form only')}/>
 <AppText accessibilityLiveRegion="polite" style={{color:colors.textPrimary}}>{formAction}</AppText>
 <AppField colors={colors} label="Provider name" hint="Use the name shown on your medical record." value={value} onChangeText={setValue}/>
 <SelectionControl colors={colors} label="Include the selected provider records" description="Only reviewed records will be added." checked={checked} onPress={()=>setChecked(x=>!x)}/>
 <DisclosureButton colors={colors} label="What will be saved?" expanded={expanded} onPress={()=>setExpanded(x=>!x)}/>
 {expanded&&<AppText style={{color:colors.textPrimary}}>The selected records and their provider details. This is synthetic test content.</AppText>}
 <View style={{flexDirection:layout.stack?'column':'row',gap:space.md}}><View style={{flex:1}}><AppButton colors={colors} label="Cancel review" onPress={()=>setChecked(false)}/></View><View style={{flex:1}}><AppButton colors={colors} label="Confirm selected records" primary disabled={!checked} onPress={()=>setSaved(true)}/></View></View>
 {saved&&<AppText accessibilityLiveRegion="polite" style={{color:colors.success}}>Test confirmation complete. No real records were saved.</AppText>}
 </ScrollView></SafeAreaView></SafeAreaProvider>;
}
AppRegistry.registerComponent('main',()=>Harness);
