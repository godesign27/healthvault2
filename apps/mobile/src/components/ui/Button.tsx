import {AppButton} from './AdaptiveControls';
import {recordsColors} from '../../theme/records';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  darkMode?: boolean;
};
export function Button({label,onPress,variant='solid',disabled=false,loading=false,darkMode=false}:ButtonProps){
 return <AppButton colors={recordsColors(darkMode)} label={loading?'Please wait…':label} onPress={onPress} primary={variant==='solid'} disabled={disabled} busy={loading}/>;
}
