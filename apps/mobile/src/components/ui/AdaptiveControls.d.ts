import type {ReactNode} from 'react';
import type {StyleProp,ViewStyle,TextInputProps,GestureResponderEvent} from 'react-native';
export type ControlColors={navy:string;onAction:string;surface:string;border:string;controlBorder?:string;successAction?:string;dangerAction?:string;textPrimary:string;textSecondary:string;accent:string;accentBg:string;danger:string};
export function useAdaptiveLayout():{stack:boolean;gutter:number;contentMaxWidth:number};
export function AppButton(props:{colors:ControlColors;label:string;onPress:()=>void;disabled?:boolean;busy?:boolean;primary?:boolean;tone?:'success'|'danger';style?:StyleProp<ViewStyle>}):ReactNode;
export function SelectionControl(props:{colors:ControlColors;label:string;description?:string;checked:boolean;onPress:(event:GestureResponderEvent)=>void;disabled?:boolean;kind?:'checkbox'|'radio';compact?:boolean}):ReactNode;
export function DisclosureButton(props:{colors:ControlColors;label:string;expanded:boolean;onPress:()=>void}):ReactNode;
export function AppField(props:TextInputProps & {colors:ControlColors;label:string;hint?:string;error?:string}):ReactNode;
